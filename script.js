const mainNav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  mainNav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeNav() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', closeNav);
});

document.getElementById('navAssessmentBtn').addEventListener('click', () => { openModal(); closeNav(); });

document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    closeNav();
  }
});

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('visible');
      const stats = el.target.querySelectorAll('.stat-number[data-target]');
      if (stats.length) animateStats(stats);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

function animateStats(statEls) {
  statEls.forEach(el => {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(eased * target);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = prefix + target.toLocaleString() + suffix;
    }

    requestAnimationFrame(update);
  });
}

const modalOverlay = document.getElementById('modalOverlay');
const assessmentForm = document.getElementById('assessmentForm');
const formSuccess = document.getElementById('formSuccess');

document.getElementById('heroAssessmentBtn').addEventListener('click', openModal);
document.getElementById('ctaAssessmentBtn').addEventListener('click', openModal);
document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', handleOverlayClick);

function openModal() {
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  assessmentForm.style.display = '';
  formSuccess.classList.remove('show');
  setTimeout(() => {
    const firstInput = assessmentForm.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === modalOverlay) closeModal();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

assessmentForm.addEventListener('submit', handleFormSubmit);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('fname').value.trim();
  const business = document.getElementById('fbusiness').value.trim();
  const email = document.getElementById('femail').value.trim();
  const phone = document.getElementById('fphone').value.trim();
  const size = document.getElementById('fsize').value;

  let valid = true;

  const nameEl = document.getElementById('fname');
  const nameErr = nameEl.parentElement.querySelector('.field-error');
  if (!name) {
    nameEl.classList.add('form-error');
    if (nameErr) nameErr.classList.add('show');
    valid = false;
  } else {
    nameEl.classList.remove('form-error');
    if (nameErr) nameErr.classList.remove('show');
  }

  const bizEl = document.getElementById('fbusiness');
  const bizErr = bizEl.parentElement.querySelector('.field-error');
  if (!business) {
    bizEl.classList.add('form-error');
    if (bizErr) bizErr.classList.add('show');
    valid = false;
  } else {
    bizEl.classList.remove('form-error');
    if (bizErr) bizErr.classList.remove('show');
  }

  const emailEl = document.getElementById('femail');
  const emailErr = emailEl.parentElement.querySelector('.field-error');
  if (!email || !isValidEmail(email)) {
    emailEl.classList.add('form-error');
    if (emailErr) emailErr.classList.add('show');
    valid = false;
  } else {
    emailEl.classList.remove('form-error');
    if (emailErr) emailErr.classList.remove('show');
  }

  if (!valid) return;

  const subject = encodeURIComponent(`Free Assessment Request \u2014 ${business}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to request a free network assessment for my business.\n\nName: ${name}\nBusiness: ${business}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nTeam Size: ${size || 'Not specified'}\n\nPlease get in touch at your earliest convenience.\n\nThanks,\n${name}`
  );

  const mailto = `mailto:oxajamal@gmail.com?subject=${subject}&body=${body}`;
  window.location.href = mailto;

  assessmentForm.style.display = 'none';
  formSuccess.classList.add('show');
}

['fname', 'fbusiness', 'femail'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const val = el.value.trim();
    const isEmail = id === 'femail';
    const ok = isEmail ? (val && isValidEmail(val)) : !!val;
    if (ok) {
      el.classList.remove('form-error');
      const err = el.parentElement.querySelector('.field-error');
      if (err) err.classList.remove('show');
    }
  });
});
