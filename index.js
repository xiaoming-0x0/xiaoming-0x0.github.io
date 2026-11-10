/* ==========================================================================
   首页：时间线 + 搜索 + 标签筛选
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Blog;
  var data = { site: {}, posts: [] };
  var state = { tag: '', q: '' };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    B.getJSON('./posts/index.json').then(function (res) {
      data.site = res.site || {};
      data.posts = (res.posts || []).slice();
      B.bindChrome(data.site);
      renderHero();
      renderHeroTitle();
      renderTags();
      readHash();
      render();
      bindSearch();
      document.body.classList.add('is-ready');
    }).catch(function () {
      failState();
    });
  });

  /* ---------- hero ---------- */
  function renderHero() {
    var eb = document.getElementById('hero-eyebrow');
    if (eb && data.site.subtitle) eb.textContent = data.site.subtitle;
    var p = document.getElementById('hero-text');
    if (p && data.site.heroText) p.textContent = data.site.heroText;
  }

  function renderHeroTitle() {
    var h1 = document.getElementById('hero-title');
    var t = data.site.heroTitle;
    if (!h1 || !t) return;

    var html = B.esc(t).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
    if (h1.innerHTML !== html) h1.innerHTML = html;
  }

  /* ---------- 标签 ---------- */
  function countTags() {
    var map = {};
    data.posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        if (!map[t]) map[t] = 0;
        map[t]++;
      });
    });
    return map;
  }

  function renderTags() {
    var box = document.getElementById('tag-row');
    if (!box) return;
    var map = countTags();
    var names = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; });
    var total = data.posts.length;

    var html = '<button class="chip is-active" data-tag="">全部<span class="n">' + total + '</span></button>';
    html += names.map(function (n) {
      return '<button class="chip" data-tag="' + B.esc(n) + '">' + B.esc(n) +
             '<span class="n">' + map[n] + '</span></button>';
    }).join('');
    box.innerHTML = html;

    box.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.tag = btn.getAttribute('data-tag') || '';
      syncChips();
      writeHash();
      render();
    });
  }

  function syncChips() {
    document.querySelectorAll('#tag-row .chip').forEach(function (c) {
      c.classList.toggle('is-active', (c.getAttribute('data-tag') || '') === state.tag);
    });
  }

  /* ---------- 列表 ---------- */
  function match(p) {
    if (state.tag && (p.tags || []).indexOf(state.tag) === -1) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    var hay = [p.title, p.summary, p.search, (p.tags || []).join(' ')].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function render() {
    var box = document.getElementById('timeline');
    var stateBox = document.getElementById('list-state');
    if (!box) return;

    var list = data.posts.filter(match);

    if (!data.posts.length) {
      box.innerHTML = '';
      if (stateBox) {
        stateBox.innerHTML = '<div class="empty"><strong>还没有文章</strong>' +
          '在 <code>posts/</code> 文件夹里新建一个 <code>.md</code> 文件，然后运行 <code>python scripts/build.py</code>。</div>';
      }
      return;
    }

    if (!list.length) {
      box.innerHTML = '';
      if (stateBox) {
        stateBox.innerHTML = '<div class="empty"><strong>没有匹配的文章</strong>' +
          '换一个关键词，或者 <a href="#" id="clear-filter">清除筛选</a>。</div>';
        var c = document.getElementById('clear-filter');
        if (c) c.addEventListener('click', function (e) {
          e.preventDefault();
          state.tag = ''; state.q = '';
          var input = document.getElementById('q');
          if (input) input.value = '';
          syncChips(); writeHash(); render();
        });
      }
      return;
    }

    if (stateBox) stateBox.innerHTML = '';
    box.innerHTML = list.map(card).join('');
  }

  function card(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<span>' + B.esc(t) + '</span>';
    }).join('');
    var summary = p.summary ? '<p class="tl-summary">' + B.esc(p.summary) + '</p>' : '';
    var meta = '<span>' + B.esc(p.dateText || B.formatDate(p.date)) + '</span>';
    if (p.readingTime) meta += '<span class="sep">/</span><span>' + p.readingTime + ' 分钟</span>';
    if (p.words) meta += '<span class="sep">/</span><span>' + p.words + ' 字</span>';

    return '<div class="tl-item">' +
      '<a class="tl-card" href="./post.html?p=' + encodeURIComponent(p.slug) + '">' +
        '<div class="tl-date">' + meta + '</div>' +
        '<h2 class="tl-title">' + B.esc(p.title) + '</h2>' +
        summary +
        (tags ? '<div class="tl-tags">' + tags + '</div>' : '') +
      '</a>' +
    '</div>';
  }

  /* ---------- 搜索 ---------- */
  function bindSearch() {
    var input = document.getElementById('q');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = input.value;
        render();
      }, 120);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = ''; state.q = ''; render(); input.blur();
      }
    });
  }

  /* ---------- hash 同步：#tag=xxx ---------- */
  function readHash() {
    var m = /tag=([^&]+)/.exec(location.hash || '');
    if (m) {
      state.tag = decodeURIComponent(m[1]);
      syncChips();
    }
  }

  function writeHash() {
    var h = state.tag ? '#tag=' + encodeURIComponent(state.tag) : '';
    try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) {}
  }

  /* ---------- 失败态 ---------- */
  function failState() {
    var box = document.getElementById('timeline');
    var stateBox = document.getElementById('list-state');
    if (box) box.innerHTML = '';
    if (stateBox) {
      stateBox.innerHTML = '<div class="empty"><strong>还没有生成文章索引</strong>' +
        '在项目根目录运行 <code>python scripts/build.py</code>，' +
        '或推送到 GitHub 后等待 Actions 自动构建。</div>';
    }
    var p = document.getElementById('hero-text');
    if (p) p.textContent = '索引文件 posts/index.json 尚未生成。';
  }
})();
