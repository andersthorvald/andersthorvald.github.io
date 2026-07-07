/* =================================================================
 * SRE Wiki — 全站动效公共脚本
 * v0.2.0 (refined for v2 design system)
 *
 * 功能：
 *   1. 自动 inject bg-mesh + 2 个 blob 到 body 顶部（克制版）
 *   2. 给一组 selector 打 .reveal class
 *   3. IntersectionObserver 触发 .is-visible（错开 60ms）
 *   4. Scroll-tied parallax：mesh 反向 0.04、blob 正向 0.03/0.045
 *   5. prefers-reduced-motion 全局跳过
 *
 * 自定义：<body data-anim-scope="default|minimal">
 *   default  — 全套（默认）
 *   minimal  — 关闭 reveal（仅背景动效）
 * ================================================================= */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 自动 inject 背景层 ---------- */
  if (!document.querySelector('.bg-mesh')) {
    var m = document.createElement('div');
    m.className = 'bg-mesh';
    document.body.insertBefore(m, document.body.firstChild);
  }
  if (!document.querySelector('.blob-1')) {
    var b1 = document.createElement('div');
    b1.className = 'bg-blob blob-1';
    b1.style.cssText = 'width:500px;height:500px;top:-150px;right:-80px;background:rgba(254,207,239,0.35)';
    document.body.insertBefore(b1, document.body.firstChild);
  }
  if (!document.querySelector('.blob-2')) {
    var b2 = document.createElement('div');
    b2.className = 'bg-blob blob-2';
    b2.style.cssText = 'width:300px;height:300px;bottom:-80px;left:-60px;background:rgba(255,154,158,0.25)';
    document.body.insertBefore(b2, document.body.firstChild);
  }

  /* ---------- 2. reveal selector 列表 ---------- */
  var SCOPES = {
    default: [
      '.article-card', '.cat-card', '.feature-item', '.stat-item',
      '.download-card', '.series-banner', '.toc-list a',
      '.article-header', '.section-header', '.section-title',
      '.hero-eyebrow', '.hero-title', '.hero-desc', '.hero-actions',
      '.back-link', '.profile-card', '.interest-tag', '.social-link',
      '.about-hero-badge',
      '.article-content > h2', '.article-content > h3',
      '.article-content > p', '.article-content > pre',
      '.article-content > ul', '.article-content > ol',
      '.article-content > table', '.article-content > blockquote',
      '.article-content > .danger-callout',
      '.site-footer'
    ],
    minimal: [
      '.article-header', '.section-title', '.site-footer'
    ]
  };

  var scope = (document.body.getAttribute('data-anim-scope') || 'default').toLowerCase();
  if (!SCOPES[scope]) scope = 'default';
  var SELECTORS = SCOPES[scope];

  var nodes = document.querySelectorAll(SELECTORS.join(','));
  nodes.forEach(function (el) { el.classList.add('reveal'); });

  /* ---------- 3. IntersectionObserver 触发 reveal ---------- */
  if (reduce || !('IntersectionObserver' in window)) {
    nodes.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var seenParent = {};
    nodes.forEach(function (el) {
      var p = el.parentElement;
      var key = p ? ((p.className || '') + '|' + (p.id || '')) : '_';
      seenParent[key] = (seenParent[key] || 0) + 1;
      el.dataset.revealIdx = (seenParent[key] - 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var idx = parseInt(el.dataset.revealIdx || '0', 10);
          var delay = Math.min(idx * 60, 540);     /* 80 → 60ms, max 540 */
          setTimeout(function () { el.classList.add('is-visible'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Scroll-tied parallax ---------- */
  if (!reduce) {
    var mesh = document.querySelector('.bg-mesh');
    var blobs = document.querySelectorAll('.bg-blob');
    if (mesh || blobs.length) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.scrollY;
          if (mesh) {
            mesh.style.setProperty('transform',
              'translate3d(0,' + (y * -0.04).toFixed(2) + 'px,0) scale(1.02)');  /* -0.06 → -0.04 */
          }
          blobs.forEach(function (b, i) {
            var speed = 0.03 + i * 0.015;       /* 0.04/0.06 → 0.03/0.045 */
            b.style.setProperty('transform',
              'translate3d(0,' + (y * speed).toFixed(2) + 'px,0)');
          });
          ticking = false;
        });
      }, { passive: true });
    }
  }

  /* ---------- 5. 公开 API ---------- */
  window.MavisAnim = {
    register: function (el) {
      if (!el || el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      if (reduce || !('IntersectionObserver' in window)) {
        el.classList.add('is-visible');
        return;
      }
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io2.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      io2.observe(el);
    }
  };
})();