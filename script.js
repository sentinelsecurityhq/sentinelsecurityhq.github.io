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
  if (event.defaultPrevented) return;

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

// Free assessment modal + Formspree submission.
const modalOverlay = document.getElementById('modalOverlay');
const assessmentForm = document.getElementById('assessmentForm');
const formSuccess = document.getElementById('formSuccess');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const assessmentButtons = [
  document.getElementById('navAssessmentBtn'),
  document.getElementById('heroAssessmentBtn'),
  document.getElementById('ctaAssessmentBtn'),
].filter(Boolean);

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgororkn';
const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const FIELD_MAX_LENGTHS = {
  fname: 100,
  fbusiness: 120,
  femail: 254,
};

let submitting = false;

const isValidEmail = (email) => /^[^\s@"'<>;]{1,64}@[^\s@"'<>;.]{1,63}(\.[^\s@"'<>;.]{1,63})+$/.test(email);

const setFieldError = (el, hasError) => {
  const errEl = el.closest('.form-group')?.querySelector('.field-error');
  el.classList.toggle('form-error', hasError);
  el.setAttribute('aria-invalid', String(hasError));
  if (errEl) errEl.classList.toggle('show', hasError);
};

const resetFieldErrors = () => {
  ['fname', 'fbusiness', 'femail'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) setFieldError(el, false);
  });
};

const showSubmitError = (message) => {
  const submitBtn = assessmentForm?.querySelector('[type="submit"]');
  if (!submitBtn) return;

  let errEl = document.getElementById('formSubmitError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'formSubmitError';
    errEl.setAttribute('role', 'alert');
    errEl.className = 'form-submit-error';
    submitBtn.insertAdjacentElement('afterend', errEl);
  }
  errEl.textContent = message;
};

const clearSubmitError = () => {
  const errEl = document.getElementById('formSubmitError');
  if (errEl) errEl.textContent = '';
};

const openModal = () => {
  if (!modalOverlay || !assessmentForm || !formSuccess) return;

  modalOverlay.classList.add('open');
  modalOverlay.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  assessmentForm.style.display = '';
  formSuccess.classList.remove('show');
  clearSubmitError();
  resetFieldErrors();

  setTimeout(() => {
    const firstInput = assessmentForm.querySelector('input:not([type="hidden"])');
    if (firstInput) firstInput.focus();
  }, reduceMotion ? 0 : 240);
};

const closeModal = () => {
  if (!modalOverlay) return;

  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

const trapFocus = (event) => {
  if (!modalOverlay) return;

  const focusable = Array.from(modalOverlay.querySelectorAll(FOCUSABLE_SELECTORS))
    .filter((el) => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

assessmentButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });
});

if (modalOverlay && modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modalOverlay.classList.contains('open')) return;
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key === 'Tab') trapFocus(event);
  });
}

if (assessmentForm) {
  assessmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    clearSubmitError();

    const nameEl = document.getElementById('fname');
    const bizEl = document.getElementById('fbusiness');
    const emailEl = document.getElementById('femail');
    const submitBtn = assessmentForm.querySelector('[type="submit"]');

    const name = nameEl.value.trim();
    const business = bizEl.value.trim();
    const email = emailEl.value.trim();

    const nameOk = name.length > 0 && name.length <= FIELD_MAX_LENGTHS.fname;
    const bizOk = business.length > 0 && business.length <= FIELD_MAX_LENGTHS.fbusiness;
    const emailOk = isValidEmail(email) && email.length <= FIELD_MAX_LENGTHS.femail;

    setFieldError(nameEl, !nameOk);
    setFieldError(bizEl, !bizOk);
    setFieldError(emailEl, !emailOk);

    if (!nameOk || !bizOk || !emailOk) return;

    submitting = true;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(assessmentForm),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        assessmentForm.reset();
        assessmentForm.style.display = 'none';
        formSuccess.classList.add('show');
      } else {
        let message = 'Something went wrong. Please email us at contact@sentinelcybers.com.';
        try {
          const data = await response.json();
          if (Array.isArray(data?.errors)) {
            message = data.errors.map((err) => err.message).join('. ');
          }
        } catch (_) {
          // Use fallback message.
        }
        showSubmitError(message);
      }
    } catch (_) {
      showSubmitError('Network error. Please check your connection and try again.');
    } finally {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  ['fname', 'fbusiness', 'femail'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', () => {
      const val = el.value.trim();
      const ok = id === 'femail' ? isValidEmail(val) : val.length > 0;
      if (ok) setFieldError(el, false);
    });
  });
}

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
