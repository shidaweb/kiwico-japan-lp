(() => {
  'use strict';

  const GIF_SELECTOR = '.gif-viewport';

  // NOTE: reduced-motion 時の静止画差し替えは、
  // /images/gifs/static/*.jpg が揃ってから別途実装する。
  // 現段階では GIF をそのまま表示して視認性を優先する。

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

