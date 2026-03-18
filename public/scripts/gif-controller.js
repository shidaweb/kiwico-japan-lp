(() => {
  'use strict';

  const GIF_SELECTOR = '.gif-viewport';

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotionQuery.matches) {
    document.querySelectorAll(GIF_SELECTOR).forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      const original = img.getAttribute('src') || '';
      if (!original.includes('/source/') || !original.endsWith('.gif')) return;
      const staticSrc = original
        .replace('/source/', '/static/')
        .replace(/\.gif$/i, '.jpg');
      img.setAttribute('src', staticSrc);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (!(target instanceof HTMLImageElement)) return;

        if (entry.isIntersecting) {
          const dataSrc = target.getAttribute('data-src');
          if (dataSrc) {
            target.src = dataSrc;
            target.removeAttribute('data-src');
          }
          target.style.opacity = '1';
        }
      });
    },
    {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0.1,
    }
  );

  document.querySelectorAll(GIF_SELECTOR).forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;

    img.style.transition = 'opacity 0.5s ease';

    if (img.complete) {
      img.style.opacity = '1';
    } else {
      img.style.opacity = '0';
    }

    observer.observe(img);
  });
})();

