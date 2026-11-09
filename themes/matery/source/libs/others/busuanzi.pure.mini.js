/*
 * 不蒜子访问统计（改进版），替换主题自带的 busuanzi.pure.mini.js。
 *
 * 原版的问题：请求失败或超时时没有任何处理，页脚会一直显示空的“总访问量:”；
 * 统计服务卡住时还会拖住整个页面的 load 事件，浏览器一直显示“正在加载”。
 *
 * 改进：
 *   1. 数据到达之前先隐藏统计区域，永远不会显示空白的数字；
 *   2. 8 秒超时，失败后自动重试 1 次；
 *   3. 成功时把全站访问量/访客数缓存在 localStorage，下次打开立即显示缓存值，
 *      新数据到达后再更新；请求彻底失败时继续显示缓存（没有缓存才隐藏）；
 *   4. 等页面完全加载后才发起统计请求，统计服务再慢也不影响页面打开。
 * 页面上的元素 id 与原版完全一致，不需要修改主题模板。
 */
(function () {
    var ENDPOINT = 'https://busuanzi.ibruce.info/busuanzi?jsonpCallback=';
    var KEYS = ['site_pv', 'site_uv', 'page_pv'];
    var CACHED_KEYS = ['site_pv', 'site_uv'];   // 单页访问量因页面而异，不缓存
    var CACHE_KEY = 'busuanzi_cache_v1';
    var TIMEOUT_MS = 8000;
    var MAX_RETRIES = 1;

    function element(kind, key) {
        return document.getElementById('busuanzi_' + kind + '_' + key);
    }

    function render(data) {
        KEYS.forEach(function (key) {
            var value = element('value', key);
            var container = element('container', key);
            if (value && data && data[key] != null) {
                value.textContent = data[key];
                if (container) container.style.display = 'inline';
            }
        });
    }

    function hideEmpty() {
        KEYS.forEach(function (key) {
            var value = element('value', key);
            var container = element('container', key);
            if (container && (!value || !value.textContent)) container.style.display = 'none';
        });
    }

    function readCache() {
        try {
            return JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function writeCache(data) {
        try {
            var cached = {};
            CACHED_KEYS.forEach(function (key) { cached[key] = data[key]; });
            window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch (e) { /* 隐私模式等情况下 localStorage 不可用，忽略即可 */ }
    }

    function request(attempt) {
        var callbackName = 'BusuanziCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
        var script = document.createElement('script');
        var finished = false;
        var timer = setTimeout(fail, TIMEOUT_MS);

        function cleanup() {
            clearTimeout(timer);
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        function fail() {
            if (finished) return;
            finished = true;
            cleanup();
            window[callbackName] = function () {};   // 超时后迟到的响应直接丢弃，避免报错
            if (attempt < MAX_RETRIES) {
                request(attempt + 1);
            } else {
                hideEmpty();
            }
        }

        window[callbackName] = function (data) {
            if (finished) return;
            finished = true;
            cleanup();
            window[callbackName] = undefined;
            render(data);
            writeCache(data);
        };

        script.async = true;
        script.referrerPolicy = 'no-referrer-when-downgrade';   // 不蒜子依靠 Referer 区分页面
        script.onerror = fail;
        script.src = ENDPOINT + callbackName;
        document.head.appendChild(script);
    }

    function showCached() {
        hideEmpty();
        render(readCache());
    }

    function startRequest() {
        setTimeout(function () { request(0); }, 0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showCached);
    } else {
        showCached();
    }
    if (document.readyState === 'complete') {
        startRequest();
    } else {
        window.addEventListener('load', startRequest);
    }
})();
