/* =================================================================
 * SRE Wiki v2.0 — Article TOC + Reading Progress
 *
 * 功能：
 *   1. 自动从 .article-content h2/h3 抽取标题，生成右侧 TOC
 *   2. TOC 当前 section 高亮（基于 scroll 位置）+ 进度百分比
 *   3. 阅读进度环（右下角"↑"升级为带进度圆环）
 *
 * 自动检测：
 *   - 页面无 .article-content → 仅 setupProgressRing
 *   - 标题 < 3 个 → 不生成 TOC
 * ================================================================= */
(function () {
  'use strict';

  /* ---------- 阅读进度环（先 setup，其他页也有用） ---------- */
  setupProgressRing();

  var content = document.querySelector('.article-content');
  if (!content) return;

  var headings = content.querySelectorAll('h2, h3');
  var article = document.querySelector('article.article-card');

  // 标题 < 3 个 → 不生成 TOC
  if (headings.length < 3) return;

  /* ---------- 生成 TOC ---------- */
  headings.forEach(function (h, i) {
    var slug = (h.textContent || '').trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    h.id = slug || 'sec-' + (i + 1);
  });

  var toc = document.createElement('aside');
  toc.className = 'article-toc';
  toc.setAttribute('aria-label', '文章目录');

  var html = '<div class="toc-head"><span>目录</span><span class="toc-progress" id="tocProgress">0%</span></div><ol>';
  headings.forEach(function (h) {
    var level = h.tagName === 'H3' ? 3 : 2;
    html += '<li class="l' + level + '"><a href="#' + h.id + '" data-target="' + h.id + '">'
          + (level === 3 ? '<span class="toc-dot"></span>' : '')
          + '<span class="toc-text">' + escapeHtml(h.textContent) + '</span>'
          + '</a></li>';
  });
  html += '</ol>';
  toc.innerHTML = html;

  var main = article ? article.parentElement : document.querySelector('main');
  if (main) main.appendChild(toc);

  /* ---------- TOC 高亮 + 进度百分比 ---------- */
  var links = document.querySelectorAll('.article-toc a[data-target]');
  var headingEls = Array.prototype.slice.call(headings);
  var tocProgress = document.getElementById('tocProgress');
  var ticking = false;

  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var scrollY = window.scrollY;
      var articleH = article ? article.offsetHeight : 0;
      var articleTop = article ? article.offsetTop : 0;
      var vp = window.innerHeight;

      // 当前 section
      var current = null;
      for (var i = headingEls.length - 1; i >= 0; i--) {
        var top = headingEls[i].getBoundingClientRect().top;
        if (top <= 120) { current = headingEls[i].id; break; }
      }
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.dataset.target === current);
      });

      // TOC 进度：基于文章阅读完成度
      if (tocProgress && articleH > 0) {
        var start = articleTop;
        var end = articleTop + articleH - vp;
        var pct = 0;
        if (scrollY > start) {
          pct = Math.min(100, Math.max(0,
            ((scrollY - start) / Math.max(1, end - start)) * 100));
        }
        tocProgress.textContent = Math.floor(pct) + '%';
      }

      ticking = false;
    });
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    update();
  }, { passive: true });
  update();

  // TOC 链接点击：平滑滚动
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.dataset.target;
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();

/* ---------- 阅读进度环（独立于 TOC，无 toc 也能用） ---------- */
function setupProgressRing() {
  var btn = document.getElementById('scrollProgress');
  if (!btn) return;
  var fg = btn.querySelector('.fg');
  var circumference = 2 * Math.PI * 16;
  if (fg) fg.style.strokeDasharray = '0 ' + circumference;
  var ticking = false;
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
      if (fg) fg.style.strokeDasharray = (pct / 100 * circumference) + ' ' + circumference;
      if (window.scrollY > 400) btn.classList.add('visible');
      else btn.classList.remove('visible');
      ticking = false;
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
