'use strict';

// ── Navigation ────────────────────────────────────────────────────────────────
const mainNav = document.getElementById('mainNav');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  mainNav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeNav() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', closeNav));

document.getElementById('navAssessmentBtn').addEventListener('click', () => {
  openModal();
  closeNav();
});

document.addEventListener('click', (e) => {
  if (
    navLinks.classList.contains('open') &&
    !navLinks.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeNav();
  }
});

// ── Fade-in / Stats animation ─────────────────────────────────────────────────
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    const stats = entry.target.querySelectorAll('.stat-number[data-target]');
    if (stats.length) animateStats(stats);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

function animateStats(statEls) {
  statEls.forEach(el => {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.target);
    if (!Number.isFinite(target)) return;

    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(eased * target);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(update);
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const assessmentForm = document.getElementById('assessmentForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn = assessmentForm.querySelector('[type="submit"]');

const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

document.getElementById('heroAssessmentBtn').addEventListener('click', openModal);
document.getElementById('ctaAssessmentBtn').addEventListener('click', openModal);
document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', handleOverlayClick);

function openModal() {
  modalOverlay.classList.add('open');
  modalOverlay.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  assessmentForm.style.display = '';
  formSuccess.classList.remove('show');
  clearSubmitError();
  resetFieldErrors();
  setTimeout(() => {
    const firstInput = assessmentForm.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === modalOverlay) closeModal();
}

document.addEventListener('keydown', (e) => {
  if (!modalOverlay.classList.contains('open')) return;
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key === 'Tab') trapFocus(e);
});

function trapFocus(e) {
  const focusable = Array.from(
    modalOverlay.querySelectorAll(FOCUSABLE_SELECTORS)
  ).filter(el => getComputedStyle(el).display !== 'none' &&
    getComputedStyle(el).visibility !== 'hidden');

  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// ── Form ──────────────────────────────────────────────────────────────────────
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgororkn';

const FIELD_MAX_LENGTHS = {
  fname: 100,
  fbusiness: 120,
  femail: 254,
  fphone: 30,
};

let submitting = false;

assessmentForm.addEventListener('submit', handleFormSubmit);

function isValidEmail(email) {
  // Checks for local@domain.tld structure; rejects common injection characters
  return /^[^\s@"'<>;]{1,64}@[^\s@"'<>;.]{1,63}(\.[^\s@"'<>;.]{1,63})+$/.test(email);
}

function setFieldError(el, hasError) {
  const errEl = el.closest('.form-group')?.querySelector('.field-error');
  el.classList.toggle('form-error', hasError);
  el.setAttribute('aria-invalid', String(hasError));
  if (errEl) errEl.classList.toggle('show', hasError);
}

function resetFieldErrors() {
  ['fname', 'fbusiness', 'femail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) setFieldError(el, false);
  });
}

function showSubmitError(message) {
  let errEl = document.getElementById('formSubmitError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'formSubmitError';
    errEl.setAttribute('role', 'alert');
    errEl.className = 'form-submit-error';
    submitBtn.insertAdjacentElement('afterend', errEl);
  }
  errEl.textContent = message;
}

function clearSubmitError() {
  const errEl = document.getElementById('formSubmitError');
  if (errEl) errEl.textContent = '';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (submitting) return;

  clearSubmitError();

  const nameEl = document.getElementById('fname');
  const bizEl = document.getElementById('fbusiness');
  const emailEl = document.getElementById('femail');

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

  // Lock the form during submission
  submitting = true;
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = 'Sending\u2026';

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
      let msg = 'Something went wrong. Please email us at contact@sentinelcybers.com.';
      try {
        const data = await response.json();
        if (Array.isArray(data?.errors)) {
          msg = data.errors.map(err => err.message).join('. ');
        }
      } catch (_) { /* JSON parse failure — use fallback message */ }
      showSubmitError(msg);
    }
  } catch (_) {
    showSubmitError('Network error. Please check your connection and try again.');
  } finally {
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

// Clear field-level errors as the user corrects their input
['fname', 'fbusiness', 'femail'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const val = el.value.trim();
    const isEmail = id === 'femail';
    const ok = isEmail ? isValidEmail(val) : val.length > 0;
    if (ok) setFieldError(el, false);
  });
});
