/* ==========================================================================
   文章页：渲染 Markdown、目录、进度条、上一篇 / 下一篇
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Blog;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var slug = new URLSearchParams(location.search).get('p') || '';
    slug = slug.replace(/\.md$/i, '').replace(/[?#].*$/, '').trim();

    if (!slug) {
      fail('没有指定文章', '请从首页的文章列表进入。');
      return;
    }

    B.getJSON('./posts/index.json').then(function (res) {
      var site = res.site || {};
      var posts = res.posts || [];
      B.bindChrome(site);

      var idx = -1;
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].slug === slug) { idx = i; break; }
      }
      if (idx === -1) {
        fail('找不到这篇文章', '它可能被删除或改名了。');
        return;
      }

      var meta = posts[idx];
      return B.getText('./posts/' + encodeURIComponent(slug) + '.md').then(function (md) {
        render(site, posts, meta, idx, md);
      });
    }).catch(function (err) {
      fail('加载失败', (err && err.message) || '检查一下网络或文件路径。');
    });
  });

  function render(site, posts, meta, idx, md) {
    var bodyEl = document.getElementById('post-body');
    var raw = B.stripFrontMatter(md);

    document.title = meta.title + ' · ' + (site.title || '博客');
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.summary || meta.title || '');

    document.getElementById('post-title').textContent = meta.title || '';
    document.getElementById('post-meta').innerHTML = buildMeta(meta);

    bodyEl.innerHTML = toHtml(raw);
    B.enhance(bodyEl);
    highlightCode();
    B.buildToc(bodyEl, document.getElementById('toc'));
    renderNav(posts, idx);
    bindProgress();
    pushRssLink(site);
  }

  function buildMeta(meta) {
    var bits = [];
    bits.push('<span>' + B.esc(meta.dateText || B.formatDate(meta.date)) + '</span>');
    if (meta.readingTime) bits.push('<span class="dot"></span><span>' + meta.readingTime + ' 分钟阅读</span>');
    if (meta.words) bits.push('<span class="dot"></span><span>' + meta.words + ' 字</span>');
    if (meta.tags && meta.tags.length) {
      bits.push('<span class="dot"></span>');
      meta.tags.forEach(function (t) {
        bits.push('<a class="tag" href="./index.html#tag=' + encodeURIComponent(t) + '">' + B.esc(t) + '</a>');
      });
    }
    return bits.join('');
  }

  function toHtml(md) {
    if (window.marked && typeof window.marked.parse === 'function') {
      try { return window.marked.parse(md); } catch (e) {}
    }
    return '<pre>' + B.esc(md) + '</pre>';
  }

  function highlightCode() {
    if (!window.hljs) return;
    document.querySelectorAll('#post-body pre code').forEach(function (el) {
      if (el.getAttribute('data-highlighted') === 'yes') return;
      try { window.hljs.highlightElement(el); } catch (e) {}
    });
  }

  function renderNav(posts, idx) {
    var box = document.getElementById('post-nav');
    if (!box) return;
    var older = posts[idx + 1];
    var newer = posts[idx - 1];

    var left = older
      ? '<a href="./post.html?p=' + encodeURIComponent(older.slug) + '">' +
          '<span class="lbl">← 上一篇</span><span class="ttl">' + B.esc(older.title) + '</span></a>'
      : '<span class="is-empty"></span>';

    var right = newer
      ? '<a class="next" href="./post.html?p=' + encodeURIComponent(newer.slug) + '">' +
          '<span class="lbl">下一篇 →</span><span class="ttl">' + B.esc(newer.title) + '</span></a>'
      : '<span class="is-empty"></span>';

    box.innerHTML = left + right;
  }

  function bindProgress() {
    var bar = document.getElementById('progress');
    if (!bar) return;
    var ticking = false;

    function update() {
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var top = window.pageYOffset || h.scrollTop || 0;
      var pct = max > 0 ? (top / max) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function pushRssLink(site) {
    if (!site || !site.url) return;
    var link = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    if (link) link.setAttribute('href', site.url.replace(/\/$/, '') + '/feed.xml');
  }

  function fail(title, msg) {
    var h = document.getElementById('post-title');
    if (h) h.textContent = title;
    var m = document.getElementById('post-meta');
    if (m) m.innerHTML = '';
    var body = document.getElementById('post-body');
    if (body) {
      body.innerHTML = '<div class="empty"><strong>' + B.esc(title) + '</strong>' +
        '<p>' + B.esc(msg) + '</p>' +
        '<p style="margin-top:18px"><a href="./index.html">← 回到首页</a></p></div>';
    }
    var nav = document.getElementById('post-nav');
    if (nav) nav.innerHTML = '';
  }
})();
