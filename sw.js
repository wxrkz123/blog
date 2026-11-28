'use strict';
// 由 scripts/pwa.js 生成，不要直接修改
const VERSION = '6abb04a4ba';
const ROOT = "/blog/";
const CORE = 'core-' + VERSION;      // 主题公共文件，随版本更新
const PAGES = 'pages';               // 读者保存的网页（跨版本保留）
const ASSETS = 'assets';             // 保存的文章的图片，以及字体、其他 CSS/JS（跨版本保留）
const OFFLINE = "/blog/offline.html";
const PRECACHE = ["/blog/offline.html","/blog/pwa/icon-192.png","/blog/libs/awesome/css/all.min.css","/blog/libs/materialize/materialize.min.css","/blog/libs/aos/aos.css","/blog/libs/animate/animate.min.css","/blog/css/matery.css","/blog/css/my.css","/blog/css/dark.css","/blog/css/post.css","/blog/libs/jquery/jquery-3.6.0.min.js","/blog/libs/materialize/materialize.min.js","/blog/libs/aos/aos.js","/blog/js/matery.js","/blog/libs/masonry/masonry.pkgd.min.js"];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CORE).then(cache =>
    // 单个文件失败不影响安装
    Promise.all(PRECACHE.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('core-') && k !== CORE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

// 网址统一成 /blog/a/b/ 的形式作为缓存键
function pageKey(url) {
  const u = new URL(url);
  let p = u.pathname.replace(/index\.html$/, '');
  if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  return u.origin + p;
}

function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function handlePage(event) {
  const key = pageKey(event.request.url);
  const cache = await caches.open(PAGES);
  const cached = await cache.match(key);
  const network = fetch(event.request).then(async res => {
    // 只更新读者已经保存的文章，没保存的不自动保存
    if (cached && res.ok && res.type === 'basic') await cache.put(key, res.clone());
    return res;
  });
  event.waitUntil(network.catch(() => null));
  if (cached) {
    // 有保存的版本：网络 3 秒内没回应就先用保存的版本
    return Promise.race([network.catch(() => cached), timeout(3000).then(() => cached)]);
  }
  try {
    return await network;
  } catch (e) {
    return (await caches.match(OFFLINE)) || Response.error();
  }
}

async function savedOrNetwork(event) {   // 保存过的文件直接用，否则联网（不自动保存）
  const hit = await caches.match(event.request, { ignoreSearch: true });
  return hit || fetch(event.request);
}

async function staleWhileRevalidate(event, name) {
  const cache = await caches.open(name);
  const hit = await caches.match(event.request, { ignoreSearch: true });
  const network = fetch(event.request).then(res => {
    if (res.ok && res.type === 'basic') cache.put(event.request, res.clone());
    return res;
  });
  if (hit) { event.waitUntil(network.catch(() => null)); return hit; }
  return network;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;  // 外部网站不处理
  if (url.pathname.endsWith('/sw.js')) return;

  if (req.mode === 'navigate') return event.respondWith(handlePage(event));
  if (url.pathname.endsWith('/search.xml')) return;   // 搜索索引交给浏览器，不保存
  if (PRECACHE.includes(url.pathname)) {
    return event.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || staleWhileRevalidate(event, ASSETS)));
  }
  const dest = req.destination;
  if (dest === 'image' || dest === 'font' || /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(url.pathname)) {
    return event.respondWith(savedOrNetwork(event));
  }
  if (dest === 'style' || dest === 'script' || /\.(css|js)$/i.test(url.pathname)) {
    return event.respondWith(staleWhileRevalidate(event, ASSETS));
  }
});

// 页面可以询问某篇文章是否已保存
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'is-saved' && event.ports[0]) {
    caches.open(PAGES).then(c => c.match(pageKey(event.data.url))).then(hit => event.ports[0].postMessage(!!hit));
  }
});
