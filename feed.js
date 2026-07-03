/*!
 * Webby Feed — feed.js
 * Renders a social feed widget from a locked JSON schema.
 * https://github.com/webbyco/webby-feed
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function bool(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    return String(v).toLowerCase() === 'true';
  }
  function num(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }

  function injectStyles() {
    if (document.getElementById('wf-styles')) return;
    var css = ''
      + '.webby-feed{--wf-accent:#c8ff4d;--wf-gap:10px;--wf-radius:10px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box;}'
      + '.webby-feed *{box-sizing:border-box;}'
      + '.wf-grid{display:grid;}'
      + '.wf-masonry{column-gap:var(--wf-gap);}'
      + '.wf-masonry .wf-item{break-inside:avoid;margin-bottom:var(--wf-gap);}'
      + '.wf-carousel{display:flex;gap:var(--wf-gap);overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-y;}'
      + '.wf-carousel .wf-item{flex:0 0 auto;scroll-snap-align:start;}'
      + '.wf-carousel.wf-sb-hidden{scrollbar-width:none;-ms-overflow-style:none;}'
      + '.wf-carousel.wf-sb-hidden::-webkit-scrollbar{display:none;}'
      + '.wf-carousel.wf-sb-hover{scrollbar-width:thin;scrollbar-color:transparent transparent;}'
      + '.wf-carousel.wf-sb-hover:hover{scrollbar-color:#c3c7cc transparent;}'
      + '.wf-carousel.wf-sb-hover::-webkit-scrollbar{height:6px;}'
      + '.wf-carousel.wf-sb-hover::-webkit-scrollbar-thumb{background:transparent;}'
      + '.wf-carousel.wf-sb-hover:hover::-webkit-scrollbar-thumb{background:#c3c7cc;}'
      + '.wf-item{background:#fff;border-radius:var(--wf-radius);overflow:hidden;border:1px solid #eceef0;display:flex;flex-direction:column;text-decoration:none;color:inherit;cursor:pointer;}'
      + '.wf-thumb{position:relative;aspect-ratio:1/1;overflow:hidden;background:#e9ebee;flex-shrink:0;}'
      + '.wf-thumb img{width:100%;height:100%;object-fit:cover;display:block;}'
      + '.wf-play{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;}'
      + '.wf-play svg{width:12px;height:12px;fill:#fff;}'
      + '.wf-duration{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;line-height:1.4;}'
      + '.wf-body{padding:10px 12px 12px;flex:1;display:flex;flex-direction:column;}'
      + '.wf-caption{font-size:12.5px;color:#2a2d31;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em;}'
      + '.wf-engage{display:flex;gap:12px;margin-top:8px;font-size:11.5px;color:#7b8188;}'
      + '.wf-engage span{display:flex;align-items:center;gap:4px;}'
      + '.wf-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}'
      + '.wf-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--wf-accent),#8fb536);flex-shrink:0;}'
      + '.wf-handle{font-size:13px;font-weight:600;color:#1a1c1e;}'
      + '.wf-sub{font-size:11.5px;color:#9aa0a6;}'
      + '.wf-badge{display:inline-flex;align-items:center;gap:5px;margin-top:14px;font-size:10.5px;color:#a7acb1;}'
      + '.wf-badge b{color:#1a1c1e;}'
      + '.wf-lightbox-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;}'
      + '.wf-lightbox-content{max-width:640px;width:100%;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh;}'
      + '.wf-lightbox-media{background:#000;display:flex;align-items:center;justify-content:center;max-height:60vh;overflow:hidden;}'
      + '.wf-lightbox-media img,.wf-lightbox-media video{width:100%;max-height:60vh;object-fit:contain;}'
      + '.wf-lightbox-body{padding:16px 18px;overflow-y:auto;}'
      + '.wf-lightbox-caption{font-size:14px;color:#2a2d31;line-height:1.5;}'
      + '.wf-lightbox-close{position:absolute;top:18px;right:18px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);color:#fff;border:none;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;}'
      + '.wf-lightbox-link{display:inline-block;margin-top:10px;font-size:12.5px;color:var(--wf-accent-text,#1a1c1e);text-decoration:underline;}'
      + '@media(max-width:640px){.wf-grid{grid-template-columns:repeat(2,1fr) !important;}}'
      + '@media(max-width:420px){.wf-grid{grid-template-columns:repeat(1,1fr) !important;}}';
    var style = document.createElement('style');
    style.id = 'wf-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function playIconSVG() {
    return '<div class="wf-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>';
  }

  function fmtDuration(sec) {
    sec = parseInt(sec, 10);
    if (!sec || isNaN(sec)) return '';
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function buildTile(post, cfg) {
    var el = document.createElement('div');
    el.className = 'wf-item';
    if (cfg.layout === 'carousel') {
      el.style.width = cfg.tileSize > 0 ? cfg.tileSize + 'px' : '220px';
    }

    var thumb = document.createElement('div');
    thumb.className = 'wf-thumb';
    var img = document.createElement('img');
    img.src = post.image || '';
    img.loading = 'lazy';
    img.alt = post.caption ? post.caption.slice(0, 80) : '';
    img.onerror = function () { thumb.style.background = '#e9ebee'; img.style.display = 'none'; };
    thumb.appendChild(img);

    if (post.type === 'video') {
      thumb.insertAdjacentHTML('beforeend', playIconSVG());
      var d = fmtDuration(post.duration);
      if (d) {
        var dur = document.createElement('div');
        dur.className = 'wf-duration';
        dur.textContent = d;
        thumb.appendChild(dur);
      }
    }
    el.appendChild(thumb);

    if (cfg.captions || cfg.engagement) {
      var body = document.createElement('div');
      body.className = 'wf-body';
      if (cfg.captions && post.caption) {
        var cap = document.createElement('div');
        cap.className = 'wf-caption';
        cap.textContent = post.caption;
        body.appendChild(cap);
      }
      if (cfg.engagement) {
        var eng = document.createElement('div');
        eng.className = 'wf-engage';
        var likeSpan = '<span>\u2665 ' + (post.likes || 0) + '</span>';
        var commentSpan = '<span>\uD83D\uDCAC ' + (post.comments || 0) + '</span>';
        var viewSpan = post.type === 'video' && post.views ? '<span>\u25B6 ' + post.views + '</span>' : '';
        eng.innerHTML = likeSpan + commentSpan + viewSpan;
        body.appendChild(eng);
      }
      el.appendChild(body);
    }

    if (cfg.lightbox) {
      el.addEventListener('click', function () { openLightbox(post); });
    } else if (post.permalink) {
      el.addEventListener('click', function () { window.open(post.permalink, '_blank', 'noopener'); });
    }

    return el;
  }

  function openLightbox(post) {
    var overlay = document.createElement('div');
    overlay.className = 'wf-lightbox-overlay';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    var closeBtn = document.createElement('button');
    closeBtn.className = 'wf-lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', close);
    overlay.appendChild(closeBtn);

    var content = document.createElement('div');
    content.className = 'wf-lightbox-content';

    var media = document.createElement('div');
    media.className = 'wf-lightbox-media';
    if (post.type === 'video' && post.video) {
      var video = document.createElement('video');
      video.src = post.video;
      video.controls = true;
      video.autoplay = true;
      media.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = post.image;
      media.appendChild(img);
    }
    content.appendChild(media);

    var body = document.createElement('div');
    body.className = 'wf-lightbox-body';
    var cap = document.createElement('div');
    cap.className = 'wf-lightbox-caption';
    cap.textContent = post.caption || '';
    body.appendChild(cap);
    if (post.permalink) {
      var link = document.createElement('a');
      link.className = 'wf-lightbox-link';
      link.href = post.permalink;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'View on Instagram \u2192';
      body.appendChild(link);
    }
    content.appendChild(body);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    function close() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    }
  }

  function attachScrollLock(track) {
    var startX = 0, startY = 0, locked = null;
    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      locked = null;
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (locked === null) {
        var dx = Math.abs(e.touches[0].clientX - startX);
        var dy = Math.abs(e.touches[0].clientY - startY);
        locked = dx > dy ? 'x' : 'y';
      }
      if (locked === 'x') e.preventDefault();
    }, { passive: false });
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    }, { passive: false });
  }

  function setupAutoplay(track, cfg) {
    if (cfg.autoplay === 'off') return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    if (cfg.autoplay === 'continuous') {
      var pxPerFrame = 0.25 + (cfg.speed - 1) * (2.5 - 0.25) / 9;
      var halfWidth = track.scrollWidth / 2;
      var raf;
      function tick() {
        track.scrollLeft += pxPerFrame;
        if (track.scrollLeft >= halfWidth) track.scrollLeft -= halfWidth;
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    } else if (cfg.autoplay === 'interval') {
      var seconds = 6.4 - (cfg.speed - 1) * (6.4 - 1) / 9;
      setInterval(function () {
        var first = track.querySelector('.wf-item');
        if (!first) return;
        var basis = first.getBoundingClientRect().width + cfg.gap;
        var step = cfg.advance === 'page' ? track.clientWidth : basis;
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
      }, seconds * 1000);
    }
  }

  function renderWidget(root, feed, cfg) {
    root.innerHTML = '';
    root.style.setProperty('--wf-accent', cfg.accent);
    if (cfg.maxWidth > 0) {
      root.style.maxWidth = cfg.maxWidth + 'px';
      if (cfg.align === 'center') root.style.margin = '0 auto';
    }

    if (cfg.header && feed.profile) {
      var header = document.createElement('div');
      header.className = 'wf-header';
      var avatar = document.createElement('div');
      avatar.className = 'wf-avatar';
      header.appendChild(avatar);
      var meta = document.createElement('div');
      meta.innerHTML = '<div class="wf-handle">' + (feed.profile.handle || '') + '</div><div class="wf-sub">' + (feed.profile.subtitle || '') + '</div>';
      header.appendChild(meta);
      root.appendChild(header);
    }

    var posts = (feed.posts || []).slice(0, cfg.posts > 0 ? cfg.posts : undefined);

    var track = document.createElement('div');
    track.style.setProperty('--wf-gap', cfg.gap + 'px');
    track.style.setProperty('--wf-radius', cfg.radius + 'px');
    track.style.gap = cfg.gap + 'px';

    if (cfg.layout === 'grid') {
      track.className = 'wf-grid';
      track.style.gridTemplateColumns = 'repeat(' + cfg.columns + ',1fr)';
    } else if (cfg.layout === 'masonry') {
      track.className = 'wf-masonry';
      track.style.columnCount = cfg.columns;
    } else {
      track.className = 'wf-carousel wf-sb-' + cfg.scrollbar;
      attachScrollLock(track);
    }

    posts.forEach(function (p) { track.appendChild(buildTile(p, cfg)); });
    if (cfg.layout === 'carousel' && cfg.autoplay === 'continuous') {
      posts.forEach(function (p) { track.appendChild(buildTile(p, cfg)); });
    }

    root.appendChild(track);

    if (cfg.tier === 'free') {
      var badge = document.createElement('div');
      badge.className = 'wf-badge';
      badge.innerHTML = 'Feed by <b>Webby Co</b>';
      root.appendChild(badge);
    }

    if (cfg.layout === 'carousel') {
      requestAnimationFrame(function () { setupAutoplay(track, cfg); });
    }
  }

  function readConfig(el) {
    return {
      layout: el.getAttribute('data-layout') || 'grid',
      columns: num(el.getAttribute('data-columns'), 3),
      tileSize: num(el.getAttribute('data-tile-size'), 0),
      gap: num(el.getAttribute('data-gap'), 10),
      radius: num(el.getAttribute('data-radius'), 10),
      posts: num(el.getAttribute('data-posts'), 0),
      accent: el.getAttribute('data-accent') || '#c8ff4d',
      header: bool(el.getAttribute('data-header'), true),
      captions: bool(el.getAttribute('data-captions'), true),
      engagement: bool(el.getAttribute('data-engagement'), true),
      lightbox: bool(el.getAttribute('data-lightbox'), true),
      autoplay: el.getAttribute('data-autoplay') || 'off',
      speed: num(el.getAttribute('data-speed'), 5),
      advance: el.getAttribute('data-advance') || 'one',
      scrollbar: el.getAttribute('data-scrollbar') || 'visible',
      maxWidth: num(el.getAttribute('data-max-width'), 0),
      align: el.getAttribute('data-align') || 'left',
      tier: el.getAttribute('data-tier') || 'basic'
    };
  }

  function loadFeed(el, cb) {
    var src = el.getAttribute('data-feed');
    if (!src) { console.error('[webby-feed] Missing data-feed attribute.'); return; }
    if (src.charAt(0) === '#') {
      var node = document.querySelector(src);
      if (!node) { console.error('[webby-feed] data-feed selector not found:', src); return; }
      try { cb(JSON.parse(node.textContent)); }
      catch (e) { console.error('[webby-feed] Could not parse inline feed JSON.', e); }
      return;
    }
    fetch(src, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(cb)
      .catch(function (e) { console.error('[webby-feed] Could not load feed from', src, e); });
  }

  function init() {
    injectStyles();
    var nodes = document.querySelectorAll('.webby-feed');
    nodes.forEach(function (el) {
      var cfg = readConfig(el);
      loadFeed(el, function (feed) { renderWidget(el, feed, cfg); });
    });
  }

  ready(init);
})();
