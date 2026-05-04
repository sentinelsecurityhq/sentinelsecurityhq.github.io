const reduceMotion = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

// Reveal on scroll, with a safe fallback for older browsers.
const reveals = document.querySelectorAll('.reveal');
const revealNow = (el) => {
  if (el.dataset.revealed === 'true') return;

  el.dataset.revealed = 'true';
  el.classList.add('in');
};
const counters = document.querySelectorAll('[data-count-to]');

document.querySelectorAll('.stat-grid, .feat-grid, .steps, .why-grid').forEach((group) => {
  group.querySelectorAll('.reveal-stagger').forEach((el, index) => {
    el.style.setProperty('--stagger-index', index);
  });
});

const formatCounter = (el, value) => {
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  el.textContent = `${prefix}${Math.round(value).toLocaleString()}${suffix}`;
};

const animateCounter = (el) => {
  if (el.dataset.counted === 'true') return;

  el.dataset.counted = 'true';

  const target = Number(el.dataset.countTo);
  if (!Number.isFinite(target)) return;

  if (reduceMotion) {
    formatCounter(el, target);
    return;
  }

  const duration = 1450;
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  formatCounter(el, 0);

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    formatCounter(el, target * easeOut(progress));

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      formatCounter(el, target);
    }
  };

  requestAnimationFrame(tick);
};

if (!reduceMotion) {
  counters.forEach((el) => formatCounter(el, 0));
}

if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        revealNow(entry.target);
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  reveals.forEach((el) => io.observe(el));

  const counterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.35 });

  counters.forEach((el) => counterObserver.observe(el));
} else {
  reveals.forEach(revealNow);
  counters.forEach(animateCounter);
}

requestAnimationFrame(() => {
  const vh = window.innerHeight;
  reveals.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) revealNow(el);
  });

  counters.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) animateCounter(el);
  });
});

// Keep same-page CTA/navigation links smooth without interfering with mailto links.
document.addEventListener('click', (event) => {
  const clicked = event.target instanceof Element ? event.target : null;
  if (!clicked || typeof clicked.closest !== 'function') return;

  const link = clicked.closest('a[href^="#"]');
  if (!link || reduceMotion) return;

  const targetId = link.hash.slice(1);
  if (!targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (history.pushState) {
    history.pushState(null, '', `#${targetId}`);
  }
});

// Subtle parallax on hero glow.
const glow = document.querySelector('.hero-glow');
if (glow && !reduceMotion) {
  let pending = false;
  let nextX = 0;
  let nextY = 0;

  window.addEventListener('mousemove', (event) => {
    nextX = (event.clientX / window.innerWidth - 0.5) * 30;
    nextY = (event.clientY / window.innerHeight - 0.5) * 20;

    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      glow.style.transform = `translate(calc(-50% + ${nextX}px), calc(-50% + ${nextY}px))`;
      pending = false;
    });
  }, { passive: true });
}

const magneticItems = document.querySelectorAll('.glass, .btn, .nav-links a, .nav-cta');

if (!reduceMotion) {
  magneticItems.forEach((item) => {
    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const xRatio = x / rect.width;
      const yRatio = y / rect.height;

      item.style.setProperty('--mx', `${x}px`);
      item.style.setProperty('--my', `${y}px`);

      if (item.classList.contains('glass')) {
        item.style.setProperty('--tilt-x', `${(0.5 - yRatio) * 4}deg`);
        item.style.setProperty('--tilt-y', `${(xRatio - 0.5) * 5}deg`);
      }
    }, { passive: true });

    item.addEventListener('pointerleave', () => {
      item.style.setProperty('--mx', '50%');
      item.style.setProperty('--my', '50%');
      item.style.setProperty('--tilt-x', '0deg');
      item.style.setProperty('--tilt-y', '0deg');
    });
  });
}
