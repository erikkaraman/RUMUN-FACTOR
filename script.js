/* ============================================================
   RUMUN-FACTOR · script.js
   ============================================================ */

/* ============================================================
   0. SITE CONFIG — edit only this object to update the site
   ============================================================ */

const SITE = {
  // Social media (leave empty string if not yet active)
  youtube:   '',   // e.g. 'https://youtube.com/@rumunfactor'
  instagram: '',
  tiktok:    '',
  facebook:  '',

  // Legal documents
  rulesUrl:   'https://drive.google.com/file/d/1GpgH2HW2oiry93Byw8gk71lrY5vcHibh/view?usp=sharing',
  gdprUrl:    'https://drive.google.com/file/d/1Z5MaOoYirjt2YMSZkiRuA8HYStF7T2sX/view?usp=sharing',
  cookieUrl:  'https://drive.google.com/file/d/1NsDYiQdF38BXjhWFtl4uhdDN0isU2D5X/view?usp=sharing',
  contactUrl: '',  // TODO: add mailto or contact page URL

  // Registration deadline (ISO string, Romania timezone)
  deadline: '2026-05-30T23:59:59',

  // Prize amount displayed in stats bar (keep in sync with HTML prize section)
  prizeAmount: '20 000 €',
};

/* ============================================================
   1. FORM STATE
   Single source of truth for all form field values.
   ============================================================ */

const formState = {
  fname: '', lname: '', dob: '', city: '',
  email: '', phone: '',
  cat: '', genre: '', story: '',
  videourl: '', videofile: null,
  cb1: false, cb2: false, cb3: false, cb4: false,
};

/* ============================================================
   2. VALIDATION HELPERS
   ============================================================ */

const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function isPhone(v) {
  if (!v) return false;
  const clean = v.replace(/[\s\-()]/g, '');
  return /^(\+40|0)7\d{8}$/.test(clean);
}

function isAdult(dob) {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() - (
    (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) ? 1 : 0
  );
  return age >= 16;
}

const isVideoValid = () => formState.videourl !== '' || formState.videofile !== null;

/* ============================================================
   3. ERROR / FIELD STATE
   ============================================================ */

/** Show or hide the error message for a given field wrapper (id="f-{fieldId}") */
function setError(fieldId, show, msg) {
  const wrapper = document.getElementById('f-' + fieldId);
  if (!wrapper) return;
  const errEl = wrapper.querySelector('.field-error');
  if (!errEl) return;

  if (show) {
    wrapper.classList.add('has-error');
    if (msg) errEl.textContent = msg;
    errEl.style.display = 'block';
  } else {
    wrapper.classList.remove('has-error');
    errEl.style.display = 'none';
  }
}

/* Only show errors for fields the user has already touched */
const touched = new Set();

function validateField(id) {
  if (!touched.has(id)) return;

  switch (id) {
    case 'fname':  setError('fname', !formState.fname); break;
    case 'lname':  setError('lname', !formState.lname); break;
    case 'city':   setError('city',  !formState.city);  break;
    case 'phone':  setError('phone', !isPhone(formState.phone),   'Format: +40 7xx xxx xxx sau 07xx xxx xxx'); break;
    case 'email':  setError('email', !isEmail(formState.email),   'Email invalid'); break;
    case 'dob':    setError('dob',   !isAdult(formState.dob),     'Vârsta minimă — 16 ani'); break;
    case 'cat':    setError('cat',   !formState.cat,              'Selectează o categorie'); break;
    case 'genre':  setError('genre', !formState.genre); break;
    case 'story':  setError('story', formState.story.length < 100,'Minimum 100 de caractere'); break;
    case 'video':  setError('video', !isVideoValid(),             'Adaugă un link sau încarcă un fișier'); break;
  }
}

/** Run all validations (marks every field as touched first) */
function validateAll() {
  const fields = ['fname','lname','dob','city','email','phone','cat','genre','story','video'];
  fields.forEach(id => { touched.add(id); validateField(id); });

  ['cb1','cb2','cb3'].forEach(id => setError(id, !formState[id], 'Acordul este necesar'));

  return isFormValid();
}

function isFormValid() {
  return !!(
    formState.fname && formState.lname && formState.city &&
    isPhone(formState.phone) && isEmail(formState.email) && isAdult(formState.dob) &&
    formState.cat && formState.genre && formState.story.length >= 100 &&
    isVideoValid() &&
    formState.cb1 && formState.cb2 && formState.cb3
  );
}

/* ============================================================
   4. FILE VALIDATION
   ============================================================ */

const FILE_MAX_BYTES = 500 * 1024 * 1024;
const FILE_ALLOWED   = ['video/mp4', 'video/quicktime'];

/** Returns an error string or null if the file is valid */
function getFileError(file) {
  if (file.size > FILE_MAX_BYTES) return 'Fișier prea mare. Maximum — 500 MB';
  if (!FILE_ALLOWED.includes(file.type)) return 'Format invalid. Sunt acceptate MP4 și MOV';
  return null;
}

/** Displays a file error inline inside the drop zone */
function showFileError(msg) {
  const textEl = document.getElementById('fileDropText');
  const dropEl = document.getElementById('fileDrop');
  if (!textEl || !dropEl) return;
  textEl.innerHTML = `<span class="file-drop-icon file-drop-icon--err">✕</span><span>${msg}</span>`;
  dropEl.classList.add('has-error');
  dropEl.classList.remove('has-file');
}

/* ============================================================
   5. INPUT BINDING
   ============================================================ */

function bindInputs() {

  // Simple text fields — shared input + blur handler
  ['fname', 'lname', 'city', 'phone', 'email'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { formState[id] = e.target.value.trim(); validateField(id); });
    el.addEventListener('blur',  () => { touched.add(id); validateField(id); });
  });

  // Date — Safari fires only 'change', not 'input'
  const dobEl = document.getElementById('dob');
  if (dobEl) {
    const onDob = e => { formState.dob = e.target.value; touched.add('dob'); validateField('dob'); };
    dobEl.addEventListener('change', onDob);
    dobEl.addEventListener('blur',   () => { touched.add('dob'); validateField('dob'); });
  }

  // Category select
  document.getElementById('cat')?.addEventListener('change', e => {
    formState.cat = e.target.value; touched.add('cat'); validateField('cat');
  });

  // Genre
  const genreEl = document.getElementById('genre');
  if (genreEl) {
    genreEl.addEventListener('input', e => { formState.genre = e.target.value.trim(); validateField('genre'); });
    genreEl.addEventListener('blur',  () => { touched.add('genre'); validateField('genre'); });
  }

  // Story textarea
  const storyEl = document.getElementById('story');
  if (storyEl) {
    storyEl.addEventListener('input', e => {
      formState.story = e.target.value.trimEnd();
      updateCharCount();
      validateField('story');
    });
    storyEl.addEventListener('blur', () => { touched.add('story'); validateField('story'); });
  }

  // Video URL
  document.getElementById('videourl')?.addEventListener('input', e => {
    formState.videourl = e.target.value.trim();
    touched.add('video');
    validateField('video');
  });

  // Video file input
  document.getElementById('videofile')?.addEventListener('change', e => {
    const file = e.target.files[0];
    touched.add('video');

    if (!file) {
      formState.videofile = null;
      updateFileDrop(null);
      validateField('video');
      return;
    }

    const err = getFileError(file);
    if (err) {
      e.target.value = '';
      formState.videofile = null;
      showFileError(err);
      validateField('video');
      return;
    }

    formState.videofile = file;
    updateFileDrop(file);
    validateField('video');
  });

  // Checkboxes
  ['cb1','cb2','cb3','cb4'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', e => { formState[id] = e.target.checked; });
  });
}

/** Updates the character counter below the story textarea */
function updateCharCount() {
  const val   = document.getElementById('story')?.value ?? '';
  const count = val.trimEnd().length;
  const el    = document.getElementById('story-count');
  if (!el) return;
  el.textContent = `(${count} / min. 100)`;
  el.style.color = count >= 100 ? 'var(--gold)' : 'var(--muted)';
}

/** Updates the file drop zone UI to reflect the current file state */
function updateFileDrop(file) {
  const textEl = document.getElementById('fileDropText');
  const dropEl = document.getElementById('fileDrop');
  if (!textEl || !dropEl) return;

  dropEl.classList.remove('has-error');

  if (file) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    textEl.innerHTML = `<span class="file-drop-icon file-drop-icon--ok">✓</span><span>${file.name} · ${sizeMB} MB</span>`;
    dropEl.classList.add('has-file');
  } else {
    textEl.innerHTML = `<span class="file-drop-icon">↑</span><span>Apasă sau trage fișierul aici</span>`;
    dropEl.classList.remove('has-file');
  }
}

/* ============================================================
   6. DRAG & DROP
   ============================================================ */

function bindDragDrop() {
  const dropEl = document.getElementById('fileDrop');
  if (!dropEl) return;

  ['dragenter','dragover'].forEach(ev => {
    dropEl.addEventListener(ev, e => { e.preventDefault(); dropEl.classList.add('drag-over'); });
  });

  dropEl.addEventListener('dragleave', e => { e.preventDefault(); dropEl.classList.remove('drag-over'); });

  dropEl.addEventListener('drop', e => {
    e.preventDefault();
    dropEl.classList.remove('drag-over');

    const file = e.dataTransfer?.files[0];
    if (!file) return;

    touched.add('video');

    const err = getFileError(file);
    if (err) { showFileError(err); validateField('video'); return; }

    formState.videofile = file;
    updateFileDrop(file);
    validateField('video');

    // Sync with native file input where supported
    try {
      const input = document.getElementById('videofile');
      const dt = new DataTransfer();
      dt.items.add(file);
      if (input) input.files = dt.files;
    } catch (_) {}
  });
}

/* ============================================================
   7. SUBMIT
   ============================================================ */

function submitForm() {
  if (!validateAll()) {
    const firstErr = document.querySelector('.has-error');
    if (firstErr) scrollToEl(firstErr);
    return;
  }

  const btn = document.getElementById('btnSubmit');
  if (btn) { btn.textContent = 'Se trimite...'; btn.disabled = true; }

  // TODO: replace setTimeout with a real fetch() call to your backend API
  console.warn('[RUMUN-FACTOR] submitForm: using fake delay — replace with real API call before going live.');
  setTimeout(() => {
    const number = '#RF-' + Math.floor(100000 + Math.random() * 900000);
    const numEl  = document.getElementById('successNumber');
    if (numEl) numEl.textContent = number;

    document.getElementById('formBody').style.display    = 'none';
    const screen = document.getElementById('successScreen');
    if (screen) { screen.classList.add('show'); screen.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 800);
}

/* ============================================================
   8. UTILITY
   ============================================================ */

/** Smooth-scroll to an element, accounting for sticky nav height */
function scrollToEl(el) {
  if (!el) return;
  const navH = document.getElementById('site-nav')?.offsetHeight ?? 0;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

function scrollToId(id) {
  scrollToEl(document.getElementById(id));
}

/* ============================================================
   9. NAVIGATION
   ============================================================ */

function closeNav() {
  const menu   = document.getElementById('navMenu');
  const toggle = document.getElementById('navToggle');
  menu?.classList.remove('open');
  if (toggle) { toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
}

/* ============================================================
   10. SITE LINKS
   Injects URLs from SITE config into every matching [data-link] element.
   ============================================================ */

function applySiteLinks() {
  const map = {
    'link-youtube':   SITE.youtube,
    'link-instagram': SITE.instagram,
    'link-tiktok':    SITE.tiktok,
    'link-facebook':  SITE.facebook,
    'link-rules':     SITE.rulesUrl,
    'link-gdpr':      SITE.gdprUrl,
    'link-cookie':    SITE.cookieUrl,
    'link-contact':   SITE.contactUrl,
  };

  Object.entries(map).forEach(([key, url]) => {
    if (!url) return;
    document.querySelectorAll(`[data-link="${key}"]`).forEach(el => {
      if (el.tagName !== 'A') return;
      el.href = url;
      if (!url.startsWith('#') && !url.startsWith('mailto')) {
        el.target = '_blank';
        el.rel    = 'noopener noreferrer';
      }
    });
  });
}

/* ============================================================
   11. COUNTDOWN TIMER
   ============================================================ */

function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const unit = (n, label) =>
    `<span class="cd-unit"><b>${String(n).padStart(2,'0')}</b><em>${label}</em></span>`;

  function tick() {
    const diff = new Date(SITE.deadline) - new Date();
    if (diff <= 0) { el.innerHTML = '<span class="cd-over">Înscrierile s-au închis</span>'; return; }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    el.innerHTML = unit(d,'zile') + unit(h,'ore') + unit(m,'min') + unit(s,'sec');
  }

  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   12. FAQ ACCORDION
   ============================================================ */

function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    const ans = item.querySelector('.faq-answer');
    if (!btn || !ans) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Collapse any currently open item
      document.querySelectorAll('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ============================================================
   13. INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Hamburger toggle
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  toggle?.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Smooth-scroll: nav links + footer links share [data-target]
  document.querySelectorAll('a[data-target]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); scrollToId(a.dataset.target); closeNav(); });
  });

  // Nav CTA
  document.getElementById('navCtaBtn')?.addEventListener('click', () => scrollToId('register'));

  // Hero buttons
  document.getElementById('btn-register')?.addEventListener('click', () => scrollToId('register'));
  document.getElementById('btn-how')?.addEventListener('click',      () => scrollToId('how'));

  // Form submit
  document.getElementById('btnSubmit')?.addEventListener('click', submitForm);

  // Success screen — restart button
  document.getElementById('btnRestart')?.addEventListener('click', () => location.reload());

  // Modules
  bindInputs();
  bindDragDrop();
  updateCharCount();
  applySiteLinks();
  startCountdown();
  initFaq();
});
