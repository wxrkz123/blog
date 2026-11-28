/* 专栏文章解密（scripts/protect.js 生成的加密文章页面会加载它）。依赖 TweetNaCl（nacl-fast.min.js）。
 *
 * 页面里的 #pp-data 是 {v: 2, n, c, s}：c 是用“内容密钥”加密的正文，s 是锁格列表，
 * 每个锁格 {i, n, c} 是用某个账号的“账号密钥”加密的内容密钥，i 是账号密钥的指纹。
 * 登录时由账号和密码派生账号密钥，保存在本机浏览器里；打开页面时找到自己的锁格，取出内容密钥，解密正文。
 * （v: 1 是只有管理员一个账号时的旧格式，正文直接用账号密钥加密；离线缓存里可能还有这样的页面。）
 *
 * 管理员的账号管理页（/admin/）也用这里的 PP.derive、PP.keyId 等函数。 */
(function () {
  'use strict';
  var opts = null;
  function storeName() { return 'blog-admin-key:' + opts.salt.slice(0, 16); }    // 名字沿用只有管理员时的写法，已登录的设备不用重新登录
  function userName() { return 'blog-user:' + opts.salt.slice(0, 16); }
  function roleName() { return 'blog-role:' + opts.salt.slice(0, 16); }          // 只用来决定菜单里显示“账号管理”，不是密钥
  function forget() { del(storeName()); del(userName()); del(roleName()); }
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function unhex(s) { var u = new Uint8Array(s.length / 2); for (var i = 0; i < u.length; i++) u[i] = parseInt(s.substr(2 * i, 2), 16); return u; }
  function keyId(k) { return hex(nacl.hash(k).subarray(0, 8)); }                 // 与 scripts/protect.js 的 keyId 相同（SHA-512 的前 8 字节）
  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} try { sessionStorage.removeItem(k); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function storedKey() {
    var k = get('sessionStorage', storeName()) || get('localStorage', storeName());
    return k && /^[0-9a-f]{64}$/.test(k) ? unhex(k) : null;
  }
  function storedUser() { return get('sessionStorage', userName()) || get('localStorage', userName()) || ''; }
  function remember(k, user, persist) {
    var store = persist ? 'localStorage' : 'sessionStorage';
    forget();
    if (!set(store, storeName(), hex(k))) { store = 'sessionStorage'; set(store, storeName(), hex(k)); }
    set(store, userName(), user);
    if (opts.admin && keyId(k) === opts.admin) set(store, roleName(), 'admin');
  }
  function markAdmin() {                             // 这个功能上线之前就登录了的管理员设备，补上标记
    if (get('sessionStorage', roleName()) || get('localStorage', roleName())) return;
    set(get('localStorage', storeName()) ? 'localStorage' : 'sessionStorage', roleName(), 'admin');
    document.documentElement.classList.add('pp-is-admin');
  }

  function payload() { return JSON.parse(document.getElementById('pp-data').textContent); }
  function contentKey(p, k) {                        // 用账号密钥打开自己的锁格，得到内容密钥；没有对应的锁格时返回 null
    if (p.v === 1) return k;
    var id = keyId(k);
    for (var i = 0; i < (p.s || []).length; i++) {
      if (p.s[i].i === id) return nacl.secretbox.open(b64(p.s[i].c), b64(p.s[i].n), k);
    }
    return null;
  }
  function open(k) {                                 // 成功时返回 {html, key}，失败返回 null
    var p = payload(), ck = contentKey(p, k);
    if (!ck) return null;
    var out = nacl.secretbox.open(b64(p.c), b64(p.n), ck);
    return out ? { html: new TextDecoder('utf-8').decode(out), key: ck } : null;
  }
  function reveal(res, k) {
    var lock = document.getElementById('pp-lock');
    var who = storedUser(), isAdmin = opts.admin && keyId(k) === opts.admin;
    if (isAdmin) markAdmin();
    var bar = '<p class="pp-bar">🔓 已登录' + (who ? '：' + esc(who) : '') + (isAdmin ? '（管理员）' : '') +
      (isAdmin && opts.admin_url ? ' · <a href="' + esc(opts.admin_url) + '">账号管理</a>' : '') +
      ' · <a onclick="PP.logout()">退出登录</a></p>';
    lock.insertAdjacentHTML('beforebegin', bar + res.html);
    lock.parentNode.removeChild(lock);
    currentKey = res.key;
    document.addEventListener('click', downloadClick);
  }
  var currentKey = null;
  function downloadClick(e) {                        // 受保护的下载文件：取回 .enc，在本机用内容密钥解密后保存
    var a = e.target.closest && e.target.closest('a[data-pp-name]');
    if (!a || !currentKey) return;
    e.preventDefault();
    var label = a.textContent;
    a.textContent = label + '（解密中…）';
    fetch(a.href).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (buf) {
        var u = new Uint8Array(buf);
        var plain = nacl.secretbox.open(u.subarray(24), u.subarray(0, 24), currentKey);
        if (!plain) throw new Error('decrypt');
        var url = URL.createObjectURL(new Blob([plain], { type: 'application/octet-stream' }));
        var tmp = document.createElement('a');
        tmp.href = url; tmp.download = a.getAttribute('data-pp-name');
        document.body.appendChild(tmp); tmp.click(); tmp.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
        a.textContent = label;
      }).catch(function () { a.textContent = label + '（下载失败，请刷新后重试）'; });
  }
  function showForm() {
    var lock = document.getElementById('pp-lock');
    lock.hidden = false;
    document.getElementById('pp-form').addEventListener('submit', login);
  }
  function derive(user, pass) {                      // 账号密钥 = PBKDF2-SHA256(账号 + 换行 + 密码, salt)
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(user + '\n' + pass), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) {
        return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(opts.salt), iterations: opts.iterations }, k, 256);
      }).then(function (bits) { return new Uint8Array(bits); });
  }
  function login(e) {
    e.preventDefault();
    var msg = document.getElementById('pp-msg'), btn = document.getElementById('pp-submit');
    var user = document.getElementById('pp-user').value.trim(), pass = document.getElementById('pp-pass').value;
    if (!window.crypto || !crypto.subtle) { msg.textContent = '这个浏览器不支持解密，请换用新版浏览器。'; return; }
    btn.disabled = true; btn.textContent = '正在验证…'; msg.textContent = '';
    derive(user, pass).then(function (k) {
      if (open(k) === null) throw new Error('bad');
      remember(k, user, document.getElementById('pp-remember').checked);
      location.reload();                               // 重新加载，让目录、代码块等功能按正常文章初始化
    }).catch(function () {
      btn.disabled = false; btn.textContent = '登录';
      msg.textContent = '账号或密码不正确，或者这个账号已被停用';
    });
  }

  window.PP = {
    setup: function (o) { opts = o; },               // 账号管理页用：只设置参数，不解密页面
    init: function (o) {                              // 加密文章页：在页面解析到这里时同步执行，有保存的密钥就直接解密
      opts = o;
      var k = storedKey();
      if (k) {
        var res = null;
        try { res = open(k); } catch (e) { res = null; }
        if (res) { reveal(res, k); return; }
        forget();                                      // 账号被删除、停用或修改了密码，旧密钥作废
      }
      showForm();
    },
    logout: function () { forget(); location.reload(); },
    derive: derive, keyId: keyId, hex: hex, unhex: unhex, b64: b64,
    storedKey: storedKey, storedUser: storedUser, remember: remember, markAdmin: function () { markAdmin(); }
  };
})();
