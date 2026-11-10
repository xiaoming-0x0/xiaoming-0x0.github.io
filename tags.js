/* ==========================================================================
   标签页：标签云 + 分组文章列表
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Blog;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    B.getJSON('./posts/index.json').then(function (res) {
      var site = res.site || {};
      var posts = res.posts || [];
      B.bindChrome(site);

      var map = {};
      posts.forEach(function (p) {
        (p.tags || []).forEach(function (t) {
          if (!map[t]) map[t] = [];
          map[t].push(p);
        });
      });

      var names = Object.keys(map).sort(function (a, b) {
        if (map[b].length !== map[a].length) return map[b].length - map[a].length;
        return a.localeCompare(b, 'zh');
      });

      var countEl = document.getElementById('tag-count');
      if (countEl) countEl.textContent = names.length;

      document.getElementById('tag-cloud').innerHTML = names.map(function (n, i) {
        return '<a class="chip" href="#tag-' + i + '">' + B.esc(n) +
               '<span class="n">' + map[n].length + '</span></a>';
      }).join('');

      document.getElementById('tag-groups').innerHTML = names.map(function (n, i) {
        var items = map[n].map(function (p) {
          return '<li><time>' + B.esc(p.dateText || B.formatDate(p.date)) + '</time>' +
                 '<a href="./post.html?p=' + encodeURIComponent(p.slug) + '">' + B.esc(p.title) + '</a></li>';
        }).join('');
        return '<section class="tag-group" id="tag-' + i + '">' +
          '<div class="tag-group-head"><h3>#' + B.esc(n) + '</h3><span>' + map[n].length + ' 篇</span></div>' +
          '<ul>' + items + '</ul></section>';
      }).join('');
    }).catch(function () {
      var box = document.getElementById('tag-groups');
      if (box) {
        box.innerHTML = '<div class="empty"><strong>还没有生成文章索引</strong>' +
          '运行 <code>python scripts/build.py</code>。</div>';
      }
    });
  });
})();
