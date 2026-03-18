(() => {
  const carousel = document.getElementById('hero-gif-carousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.hero-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  const label = document.getElementById('hero-slide-label');
  const labels = [
    'アーチェリーキット',
    'からだの仕組みキット',
    'スピンアートマシン',
    'バブルランプ',
    'レプタイルキット',
  ];

  if (!slides.length || !dots.length) return;

  let current = 0;
  let timerId;

  function show(index) {
    if (index === current) return;

    slides.forEach((slide) => {
      slide.classList.remove('opacity-100');
      slide.classList.add('opacity-0');
    });

    dots.forEach((dot) => {
      dot.classList.remove('bg-emerald-500');
      dot.classList.add('bg-gray-300');
    });

    const nextSlide = slides[index];
    const nextDot = dots[index];

    if (!nextSlide || !nextDot) return;

    nextSlide.classList.remove('opacity-0');
    nextSlide.classList.add('opacity-100');

    nextDot.classList.remove('bg-gray-300');
    nextDot.classList.add('bg-emerald-500');

    if (label && labels[index]) {
      label.textContent = labels[index];
    }

    current = index;
  }

  function next() {
    const nextIndex = (current + 1) % slides.length;
    show(nextIndex);
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(next, 4500);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = undefined;
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.index || 0);
      stopTimer();
      show(index);
      startTimer();
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startTimer();
        } else {
          stopTimer();
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(carousel);
  startTimer();
})();

