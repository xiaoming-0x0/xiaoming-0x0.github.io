/* ==========================================================================
   关于页：渲染 pages/about.md
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Blog;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var box = document.getElementById('about-body');
    if (!box) return;

    Promise.all([
      B.getText('./pages/about.md').catch(function () { return ''; }),
      B.getJSON('./posts/index.json').catch(function () { return { site: {} }; })
    ]).then(function (res) {
      var md = res[0];
      var site = (res[1] && res[1].site) || {};
      B.bindChrome(site);

      var title = document.querySelector('h1');
      if (title && site.author) title.textContent = '关于 ' + site.author;

      if (!md) {
        box.innerHTML = '<p style="color:var(--text-mute)">还没有关于页内容。编辑 <code>pages/about.md</code> 即可。</p>';
        return;
      }

      var html;
      if (window.marked && typeof window.marked.parse === 'function') {
        try { html = window.marked.parse(B.stripFrontMatter(md)); } catch (e) { html = null; }
      }
      box.innerHTML = html || '<pre>' + B.esc(B.stripFrontMatter(md)) + '</pre>';
      B.enhance(box);
    });
  });
})();
