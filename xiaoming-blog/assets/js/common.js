/* ==========================================================================
   公共脚本：主题、站点配置、工具函数
   ========================================================================== */
(function (global) {
  'use strict';

  var THEME_KEY = 'xiaoming-blog-theme';
  var root = document.documentElement;

  /* ---------------- 主题 ---------------- */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#fbfcfd' : '#08090c');
  }

  function initTheme() {
    if (!root.getAttribute('data-theme')) {
      var t = 'dark';
      try { t = localStorage.getItem(THEME_KEY) || t; } catch (e) {}
      setTheme(t);
    }
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      });
    }
  }

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' · ' + url);
      return r.json();
    });
  }

  function getText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' · ' + url);
      return r.text();
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso).slice(0, 10);
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* 从 Markdown 文本里剥掉 front matter */
  function stripFrontMatter(text) {
    var m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(text);
    return m ? text.slice(m[0].length) : text;
  }

  /* ---------------- 站点框架（标题/导航/页脚） ---------------- */
  function bindChrome(cfg) {
    if (!cfg) return;
    var brand = document.querySelector('.brand-name');
    if (brand && cfg.title) brand.textContent = cfg.title;

    var nav = document.getElementById('nav-links');
    if (nav && cfg.nav && cfg.nav.length) {
      var here = (location.pathname.split('/').pop() || 'index.html');
      nav.innerHTML = cfg.nav.map(function (item) {
        var cls = item.href === here ? ' class="is-active"' : '';
        return '<a href="./' + esc(item.href) + '"' + cls + '>' + esc(item.label) + '</a>';
      }).join('');
    }

    var f = document.getElementById('footer-text');
    if (f) {
      var y = new Date().getFullYear();
      var who = cfg.author || cfg.title || '';
      var extra = cfg.footer ? ' · ' + cfg.footer : '';
      f.textContent = '© ' + y + ' ' + who + extra;
    }
  }

  /* ---------------- 正文增强：外链、图片、代码复制 ---------------- */
  function enhance(container) {
    if (!container) return;

    container.querySelectorAll('a[href^="http"]').forEach(function (a) {
      try {
        if (a.host !== location.host) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      } catch (e) {}
    });

    container.querySelectorAll('img').forEach(function (img) {
      img.loading = 'lazy';
      img.decoding = 'async';
      if (!img.getAttribute('alt')) img.setAttribute('alt', '');
      img.addEventListener('error', function () {
        var src = img.getAttribute('src') || '';
        if (/^https?:|^data:/.test(src) || src.indexOf('posts/') === 0) return;
        img.src = 'posts/' + src.replace(/^\.?\//, '');   /* 图片误放 posts/ 时自动纠正 */
      });
    });

    container.querySelectorAll('pre').forEach(function (pre) {
      var codeEl = pre.querySelector('code');
      if (!codeEl) return;

      var m = /language-([\w+-]+)/.exec(codeEl.className || '');
      if (m) pre.setAttribute('data-lang', m[1]);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制代码');
      btn.addEventListener('click', function () {
        var text = codeEl.innerText;
        var done = function () {
          btn.textContent = '已复制';
          setTimeout(function () { btn.textContent = '复制'; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
      pre.appendChild(btn);
    });
  }

  /* ---------------- 标题锚点 + 目录 ---------------- */
  function slugify(text, used) {
    var base = String(text || '').trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!base) base = 'section';
    var id = base, i = 2;
    while (used[id]) { id = base + '-' + i; i++; }
    used[id] = true;
    return id;
  }

  function buildToc(scope, tocEl) {
    if (!tocEl) return;
    var used = {};
    var items = [];
    scope.querySelectorAll('h2, h3').forEach(function (h) {
      if (!h.id) h.id = slugify(h.textContent, used);
      items.push({ id: h.id, text: h.textContent, level: h.tagName === 'H2' ? 2 : 3 });
    });
    if (!items.length) { tocEl.innerHTML = ''; return; }
    tocEl.innerHTML = items.map(function (it) {
      return '<li class="lv' + it.level + '"><a href="#' + esc(it.id) + '">' + esc(it.text) + '</a></li>';
    }).join('');

    var links = Array.prototype.slice.call(tocEl.querySelectorAll('a'));
    var heads = items.map(function (it) { return document.getElementById(it.id); });

    var ticking = false;
    function spy() {
      ticking = false;
      var current = 0;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i] && heads[i].getBoundingClientRect().top <= 120) current = i;
      }
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    spy();
  }

  global.Blog = {
    esc: esc,
    getJSON: getJSON,
    getText: getText,
    formatDate: formatDate,
    stripFrontMatter: stripFrontMatter,
    bindChrome: bindChrome,
    enhance: enhance,
    buildToc: buildToc,
    slugify: slugify,
    setTheme: setTheme
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})(window);
