/* 专栏账号管理页（/admin/）。依赖 nacl-fast.min.js 和 protect.js（PP）。
 *
 * 普通账号保存在源码仓库的 protect/accounts.json 中：{v: 1, n, c}，c 是用管理员的账号密钥加密的
 * {v: 1, accounts: [{user, key, note, enabled, created, updated}]}，key 是该账号的账号密钥（十六进制），
 * 由管理员在这里输入密码时在浏览器里算出；密码原文不保存在任何地方。
 * 保存时通过 GitHub API 把文件提交到源码仓库，触发 GitHub Actions 重新发布网站（scripts/protect.js 读取它）。 */
(function () {
  'use strict';
  var o, root, st = { token: '', sha: null, accounts: [], dirty: false, key: null, notice: '' };
  var TOKEN = 'blog-admin-gh-token';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function getToken() { try { return localStorage.getItem(TOKEN) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN, t); else localStorage.removeItem(TOKEN); } catch (e) {} }
  function utf8ToB64(s) { var u = new TextEncoder().encode(s), b = ''; for (var i = 0; i < u.length; i++) b += String.fromCharCode(u[i]); return btoa(b); }
  function b64ToUtf8(s) { return new TextDecoder('utf-8').decode(PP.b64(s.replace(/\s/g, ''))); }
  function u8ToB64(u) { var b = ''; for (var i = 0; i < u.length; i++) b += String.fromCharCode(u[i]); return btoa(b); }
  function randomPassword() {
    var abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint32Array(12), s = '';
    crypto.getRandomValues(r);
    for (var i = 0; i < r.length; i++) s += abc[r[i] % abc.length];
    return s;
  }

  // ---------- 第一步：管理员登录 ----------
  function loginView(msg) {
    root.innerHTML =
      '<p>这个页面只有管理员可以使用。请用管理员账号登录（和专栏文章的登录是同一个账号）。</p>' +
      '<form class="pp-form pp-admin-box" id="pa-login" autocomplete="on">' +
      '<input type="text" id="pa-user" placeholder="管理员账号" autocomplete="username" required>' +
      '<input type="password" id="pa-pass" placeholder="密码" autocomplete="current-password" required>' +
      '<label class="pp-remember"><input type="checkbox" id="pa-remember" checked> 在这台设备上保持登录</label>' +
      '<button type="submit" id="pa-submit">登录</button><p class="pp-msg" id="pa-msg" role="alert">' + esc(msg || '') + '</p></form>';
    $('pa-login').addEventListener('submit', function (e) {
      e.preventDefault();
      var user = $('pa-user').value.trim(), btn = $('pa-submit');
      btn.disabled = true; btn.textContent = '正在验证…';
      PP.derive(user, $('pa-pass').value).then(function (k) {
        if (PP.keyId(k) !== o.admin) throw new Error('not admin');
        PP.remember(k, user, $('pa-remember').checked);
        step();
      }).catch(function () { btn.disabled = false; btn.textContent = '登录'; $('pa-msg').textContent = '不是管理员账号，或者密码不正确'; });
    });
  }

  // ---------- 第二步：GitHub 令牌 ----------
  function tokenView(msg) {
    root.innerHTML =
      '<p>账号列表保存在私有源码仓库 <code>' + esc(o.repo) + '</code> 里，保存修改时需要一个 GitHub 令牌（只需设置一次，保存在这台设备的浏览器里）：</p>' +
      '<ol><li>打开 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token</a>；</li>' +
      '<li>Repository access 选 <b>Only select repositories</b>，只选 <code>' + esc(o.repo) + '</code>；</li>' +
      '<li>Permissions → Repository permissions → <b>Contents</b> 选 <b>Read and write</b>，其他保持默认；</li>' +
      '<li>生成后复制令牌（以 <code>github_pat_</code> 开头），粘贴到下面。</li></ol>' +
      '<form class="pp-form pp-admin-box" id="pa-token-form"><input type="password" id="pa-token" placeholder="github_pat_…" autocomplete="off" required>' +
      '<button type="submit" id="pa-token-submit">保存令牌</button><p class="pp-msg" id="pa-msg" role="alert">' + esc(msg || '') + '</p></form>' +
      '<p class="pa-small">令牌只能读写这一个仓库。不用的时候可以在本页底部清除，或者在 GitHub 上随时撤销。</p>';
    $('pa-token-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = $('pa-token').value.trim(), btn = $('pa-token-submit');
      btn.disabled = true; btn.textContent = '正在检查…';
      fetch('https://api.github.com/repos/' + o.repo, { headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        }).then(function (repo) {
          if (!repo.permissions || !repo.permissions.push) throw new Error('readonly');
          setToken(t); step();
        }).catch(function (err) {
          btn.disabled = false; btn.textContent = '保存令牌';
          $('pa-msg').textContent = err.message === 'readonly' ? '这个令牌没有写入权限，请把 Contents 设为 Read and write'
            : '令牌无效，或者没有访问 ' + o.repo + ' 的权限（' + err.message + '）';
        });
    });
  }

  // ---------- 读取和保存账号列表 ----------
  function contentsUrl(withRef) {
    return 'https://api.github.com/repos/' + o.repo + '/contents/' + o.file + (withRef ? '?ref=' + encodeURIComponent(o.branch) : '');
  }
  function headers() { return { Authorization: 'Bearer ' + st.token, Accept: 'application/vnd.github+json' }; }
  function load() {
    root.innerHTML = '<p>正在读取账号列表…</p>';
    fetch(contentsUrl(true), { headers: headers(), cache: 'no-store' }).then(function (r) {
      if (r.status === 404) return null;
      if (r.status === 401) { setToken(''); throw new Error('token'); }
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (file) {
      if (!file) { st.sha = null; st.accounts = []; return render(); }
      st.sha = file.sha;
      var box = JSON.parse(b64ToUtf8(file.content));
      var plain = nacl.secretbox.open(PP.b64(box.c), PP.b64(box.n), st.key);
      if (!plain) return reencryptView(box);
      st.accounts = JSON.parse(new TextDecoder('utf-8').decode(plain)).accounts || [];
      render();
    }).catch(function (err) {
      if (err.message === 'token') return tokenView('令牌已失效，请重新输入');
      root.innerHTML = '<p class="pp-msg">读取失败（' + esc(err.message) + '）。请检查网络后刷新页面。</p>';
    });
  }
  // 管理员密码换过以后，账号列表还是用旧密码加密的：输入一次旧账号和密码，保存时改用新密码加密
  function reencryptView(box) {
    root.innerHTML =
      '<p>账号列表是用另一组管理员账号和密码加密的，通常是因为刚刚更换了管理员密码。请输入<b>更换之前</b>的管理员账号和密码，' +
      '页面会读出账号列表，保存时改用现在的密码加密。</p>' +
      '<form class="pp-form pp-admin-box" id="pa-old"><input type="text" id="pa-old-user" placeholder="旧的管理员账号" required>' +
      '<input type="password" id="pa-old-pass" placeholder="旧的管理员密码" required><button type="submit" id="pa-old-submit">读取</button>' +
      '<p class="pp-msg" id="pa-msg" role="alert"></p></form>';
    $('pa-old').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('pa-old-submit'); btn.disabled = true;
      PP.derive($('pa-old-user').value.trim(), $('pa-old-pass').value).then(function (k) {
        var plain = nacl.secretbox.open(PP.b64(box.c), PP.b64(box.n), k);
        if (!plain) throw new Error('bad');
        st.accounts = JSON.parse(new TextDecoder('utf-8').decode(plain)).accounts || [];
        st.dirty = true;
        st.notice = '已用旧密码读出账号列表。点“保存并发布”，账号列表会改用现在的管理员密码加密。';
        render();
      }).catch(function () { btn.disabled = false; $('pa-msg').textContent = '旧账号或密码不正确'; });
    });
  }
  function save() {
    var btn = $('pa-save'); btn.disabled = true; btn.textContent = '正在保存…';
    var nonce = nacl.randomBytes(24);
    var plain = new TextEncoder().encode(JSON.stringify({ v: 1, accounts: st.accounts }));
    var box = { v: 1, n: u8ToB64(nonce), c: u8ToB64(nacl.secretbox(plain, nonce, st.key)) };
    var n = st.accounts.filter(function (a) { return a.enabled !== false; }).length;
    var body = { message: '更新专栏账号（启用 ' + n + ' 个）', content: utf8ToB64(JSON.stringify(box, null, 1) + '\n'), branch: o.branch };
    if (st.sha) body.sha = st.sha;
    fetch(contentsUrl(false), { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(function (r) {
      if (r.status === 409 || r.status === 422) throw new Error('conflict');
      if (r.status === 401) { setToken(''); throw new Error('token'); }
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (res) {
      st.sha = res.content.sha; st.dirty = false;
      st.notice = '已保存。网站正在重新发布，大约 2 分钟后新的账号设置生效（<a href="https://github.com/' + esc(o.repo) +
        '/actions" target="_blank" rel="noopener">查看发布进度</a>）。';
      render();
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = '保存并发布';
      $('pa-status').innerHTML = '<span class="pp-msg">' + (err.message === 'conflict'
        ? '保存失败：账号列表在别处被修改过。请复制好新设置的密码，刷新页面后重试。'
        : err.message === 'token' ? '保存失败：GitHub 令牌已失效，请刷新页面重新输入。' : '保存失败（' + esc(err.message) + '），请稍后重试。') + '</span>';
    });
  }

  // ---------- 账号列表 ----------
  function render() {
    var on = st.accounts.filter(function (a) { return a.enabled !== false; }).length;
    var rows = st.accounts.map(function (a, i) {
      var enabled = a.enabled !== false;
      return '<tr' + (enabled ? '' : ' class="pa-off"') + '><td><b>' + esc(a.user) + '</b>' + (a.note ? '<br><span class="pa-small">' + esc(a.note) + '</span>' : '') + '</td>' +
        '<td>' + (enabled ? '启用' : '已停用') + '</td><td class="pa-small">' + esc(a.created || '') + '<br>' + esc(a.updated || '') + '</td>' +
        '<td class="pa-actions"><a data-act="pass" data-i="' + i + '">改密码</a><a data-act="note" data-i="' + i + '">备注</a>' +
        '<a data-act="toggle" data-i="' + i + '">' + (enabled ? '停用' : '启用') + '</a><a data-act="del" data-i="' + i + '">删除</a></td></tr>';
    }).join('');
    root.innerHTML =
      (st.notice ? '<p class="pa-notice">' + st.notice + '</p>' : '') +
      '<h2>普通账号</h2><p>共 ' + st.accounts.length + ' 个，启用 ' + on + ' 个。启用的账号可以阅读所有专栏文章；管理员账号在 GitHub 的 Secrets 里设置，不在这里。</p>' +
      (rows ? '<div class="pa-table-wrap"><table class="pa-table"><thead><tr><th>账号</th><th>状态</th><th>创建 / 修改</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="pa-small">还没有普通账号。</p>') +
      '<h2>添加账号</h2><form class="pp-form pp-admin-box" id="pa-add" autocomplete="off">' +
      '<input type="text" id="pa-new-user" placeholder="账号（例如对方的名字拼音）" required>' +
      '<div class="pa-row"><input type="text" id="pa-new-pass" placeholder="密码（至少 8 位）" required><button type="button" id="pa-gen">随机生成</button></div>' +
      '<input type="text" id="pa-new-note" placeholder="备注（可选，例如：某某课题组）">' +
      '<button type="submit" id="pa-add-submit">添加</button><p class="pp-msg" id="pa-msg" role="alert"></p></form>' +
      '<p id="pa-status" class="pa-status">' + (st.dirty ? '有尚未保存的修改。' : '所有修改都已保存。') + '</p>' +
      '<button type="button" class="pa-save" id="pa-save"' + (st.dirty ? '' : ' disabled') + '>保存并发布</button>' +
      '<p class="pa-small pa-foot">密码只用来在这台设备上算出账号密钥，不会被保存或上传；忘记密码时只能重新设置一个。' +
      '账号停用、删除或修改密码后，对方已经打开、缓存或另存的页面仍然可以阅读，新发布的页面不能再打开。<br>' +
      'GitHub 令牌已保存在这台设备上 · <a id="pa-clear-token">清除令牌</a> · <a onclick="PP.logout()">退出登录</a></p>';
    $('pa-gen').addEventListener('click', function () { $('pa-new-pass').value = randomPassword(); });
    $('pa-add').addEventListener('submit', addAccount);
    $('pa-save').addEventListener('click', save);
    $('pa-clear-token').addEventListener('click', function () { if (confirm('清除这台设备上保存的 GitHub 令牌？')) { setToken(''); location.reload(); } });
    Array.prototype.forEach.call(root.querySelectorAll('.pa-actions a'), function (a) { a.addEventListener('click', rowAction); });
  }
  function touch(notice) { st.dirty = true; st.notice = notice; render(); }
  function checkPassword(p) { return p.length >= 8 ? '' : '密码至少 8 位'; }
  function addAccount(e) {
    e.preventDefault();
    var user = $('pa-new-user').value.trim(), pass = $('pa-new-pass').value, note = $('pa-new-note').value.trim(), msg = $('pa-msg');
    if (/\s/.test(user)) { msg.textContent = '账号里不能有空格'; return; }
    if (st.accounts.some(function (a) { return a.user === user; })) { msg.textContent = '已经有这个账号了'; return; }
    if (checkPassword(pass)) { msg.textContent = checkPassword(pass); return; }
    var btn = $('pa-add-submit'); btn.disabled = true; btn.textContent = '正在计算…';
    PP.derive(user, pass).then(function (k) {
      if (PP.keyId(k) === o.admin) throw new Error('admin');
      st.accounts.push({ user: user, key: PP.hex(k), note: note, enabled: true, created: today(), updated: today() });
      touch('已添加账号 <b>' + esc(user) + '</b>，密码是 <code>' + esc(pass) + '</code>。请现在记下并发给对方（之后无法再查看），然后点“保存并发布”。');
    }).catch(function () { btn.disabled = false; btn.textContent = '添加'; msg.textContent = '不能和管理员账号使用相同的账号和密码'; });
  }
  function rowAction(e) {
    var act = e.target.getAttribute('data-act'), a = st.accounts[+e.target.getAttribute('data-i')];
    if (act === 'pass') {
      var p = prompt('为 ' + a.user + ' 设置新密码（至少 8 位）。默认填好了一个随机密码：', randomPassword());
      if (p === null) return;
      if (checkPassword(p)) { alert(checkPassword(p)); return; }
      PP.derive(a.user, p).then(function (k) {
        if (PP.keyId(k) === o.admin) { alert('不能和管理员账号使用相同的账号和密码'); return; }
        a.key = PP.hex(k); a.updated = today();
        touch('已修改 <b>' + esc(a.user) + '</b> 的密码，新密码是 <code>' + esc(p) + '</code>。请记下并发给对方，然后点“保存并发布”。');
      });
    } else if (act === 'note') {
      var n = prompt('备注：', a.note || '');
      if (n === null) return;
      a.note = n.trim(); a.updated = today(); touch('已修改备注。');
    } else if (act === 'toggle') {
      a.enabled = a.enabled === false; a.updated = today();
      touch((a.enabled ? '已启用 ' : '已停用 ') + '<b>' + esc(a.user) + '</b>，保存后生效。');
    } else if (act === 'del') {
      if (!confirm('删除账号 ' + a.user + '？删除后无法恢复，只能重新添加。')) return;
      st.accounts.splice(st.accounts.indexOf(a), 1);
      touch('已删除 <b>' + esc(a.user) + '</b>，保存后生效。');
    }
  }

  function step() {
    var k = PP.storedKey();
    if (!k || PP.keyId(k) !== o.admin) return loginView(k ? '现在登录的不是管理员账号，请用管理员账号登录。' : '');
    st.key = k;
    PP.markAdmin();                                  // 菜单里显示“账号管理”
    st.token = getToken();
    if (!st.token) return tokenView();
    load();
  }
  window.addEventListener('beforeunload', function (e) { if (st.dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.PPAdmin = {
    start: function (opts) {
      o = opts; PP.setup(opts); root = $('pp-admin');
      if (!window.crypto || !crypto.subtle) { root.textContent = '这个浏览器不支持所需的加密功能，请换用新版浏览器。'; return; }
      step();
    }
  };
})();
