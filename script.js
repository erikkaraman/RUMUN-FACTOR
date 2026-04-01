/* ============================================================
   RUMUN-FACTOR · script.js
   ============================================================ */

/* ============================================================
   0. SITE CONFIG — редагувати тільки тут
   ============================================================ */

const SITE = {
  // Соціальні мережі (порожній рядок = посилання неактивне)
  youtube:   '',   // напр. 'https://youtube.com/@rumunfactor'
  instagram: '',
  tiktok:    '',
  facebook:  '',

  // Юридичні документи
  rulesUrl:   'https://drive.google.com/file/d/1GpgH2HW2oiry93Byw8gk71lrY5vcHibh/view?usp=sharing',
  gdprUrl:    'https://drive.google.com/file/d/1Z5MaOoYirjt2YMSZkiRuA8HYStF7T2sX/view?usp=sharing',
  cookieUrl:  'https://drive.google.com/file/d/1NsDYiQdF38BXjhWFtl4uhdDN0isU2D5X/view?usp=sharing',
  contactUrl: '',  // TODO: додати mailto або сторінку контактів

  // Дедлайн реєстрації (ISO рядок, румунський часовий пояс)
  deadline: '2026-05-30T23:59:59',

  // Сума призу — відображається в stats bar
  prizeAmount: '20 000 €',

  // Вікові обмеження
  minAge: 16,
  maxAge: 80,
};

/* ============================================================
   1. FORM STATE
   Єдине джерело правди для всіх значень форми.
   ============================================================ */

const formState = {
  fname: '', lname: '', dob: '', city: '',
  email: '', phone: '',
  cat: '', genre: '', story: '',
  videourl: '',
  cb1: false, cb2: false, cb3: false, cb4: false,
};

/* ============================================================
   2. VALIDATION HELPERS
   ============================================================ */

/** Email — стандартний формат user@domain.tld */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Телефон — румунський формат: +40 7xx xxx xxx або 07xx xxx xxx */
function isPhone(v) {
  if (!v) return false;
  const clean = v.replace(/[\s\-()]/g, '');
  return /^(\+40|0)7\d{8}$/.test(clean);
}

/**
 * Вік — перевіряє мінімальний (SITE.minAge) і максимальний (SITE.maxAge) вік.
 * Повертає об'єкт { valid, tooYoung, tooOld } для точного повідомлення помилки.
 */
function checkAge(dob) {
  if (!dob) return { valid: false, tooYoung: true, tooOld: false };
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() - (
    (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) ? 1 : 0
  );
  return {
    valid:    age >= SITE.minAge && age <= SITE.maxAge,
    tooYoung: age < SITE.minAge,
    tooOld:   age > SITE.maxAge,
  };
}

/**
 * Ім'я / прізвище:
 *  — мінімум 2 символи
 *  — без цифр
 *  — тільки літери, пробіли, дефіси, апострофи
 */
function isValidName(v) {
  if (!v || v.length < 2) return false;
  return /^[\p{L}\s'\-]+$/u.test(v);
}

/**
 * URL відео — приймає посилання з:
 * YouTube, TikTok, Instagram, Google Drive, Vimeo
 */
const VIDEO_PLATFORMS = [
  { name: 'YouTube',      pattern: /^https?:\/\/(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)[\w\-]+/i },
  { name: 'TikTok',       pattern: /^https?:\/\/(www\.|vm\.)?tiktok\.com\/.+/i },
  { name: 'Instagram',    pattern: /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/.+/i },
  { name: 'Google Drive', pattern: /^https?:\/\/drive\.google\.com\/(file\/d\/|open\?id=).+/i },
  { name: 'Vimeo',        pattern: /^https?:\/\/(www\.)?vimeo\.com\/\d+/i },
];

function isValidVideoUrl(v) {
  if (!v) return false;
  return VIDEO_PLATFORMS.some(p => p.pattern.test(v.trim()));
}

/* ============================================================
   3. PHONE FORMATTER
   Live форматування під час введення: +40 7XX XXX XXX
   ============================================================ */

function formatPhone(raw) {
  // Залишаємо тільки цифри і ведучий +
  let digits = raw.replace(/[^\d+]/g, '');

  // Нормалізуємо +40 -> 40 для підрахунку
  if (digits.startsWith('+40')) {
    const rest = digits.slice(3).replace(/\D/g, '');
    const parts = rest.match(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,3})$/) ?? [];
    return ('+40 ' + [parts[1], parts[2], parts[3], parts[4]].filter(Boolean).join(' ')).trim();
  }

  if (digits.startsWith('07')) {
    const rest = digits.slice(2).replace(/\D/g, '');
    const parts = rest.match(/^(\d{0,2})(\d{0,3})(\d{0,3})$/) ?? [];
    return ('07' + [parts[1], parts[2], parts[3]].filter(Boolean).join(' ')).trim();
  }

  return raw;
}

/* ============================================================
   4. ERROR / FIELD STATE
   ============================================================ */

/** Показує або ховає помилку для поля (wrapper id="f-{fieldId}") */
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

/* Помилки показуємо лише для полів які користувач вже торкнувся */
const touched = new Set();

function validateField(id) {
  if (!touched.has(id)) return;

  switch (id) {
    case 'fname': {
      const ok = isValidName(formState.fname);
      const msg = !formState.fname
        ? 'Câmp obligatoriu'
        : 'Minim 2 caractere, fără cifre';
      setError('fname', !ok, msg);
      break;
    }
    case 'lname': {
      const ok = isValidName(formState.lname);
      const msg = !formState.lname
        ? 'Câmp obligatoriu'
        : 'Minim 2 caractere, fără cifre';
      setError('lname', !ok, msg);
      break;
    }
    case 'city':
      setError('city', !formState.city);
      break;
    case 'phone':
      setError('phone', !isPhone(formState.phone), 'Format: +40 7xx xxx xxx sau 07xx xxx xxx');
      break;
    case 'email':
      setError('email', !isEmail(formState.email), 'Email invalid');
      break;
    case 'dob': {
      const age = checkAge(formState.dob);
      const msg = age.tooYoung
        ? `Vârsta minimă — ${SITE.minAge} ani`
        : `Vârsta maximă — ${SITE.maxAge} ani`;
      setError('dob', !age.valid, msg);
      break;
    }
    case 'cat':
      setError('cat', !formState.cat, 'Selectează o categorie');
      break;
    case 'genre':
      setError('genre', !formState.genre);
      break;
    case 'story':
      setError('story', formState.story.length < 100, 'Minimum 100 de caractere');
      break;
    case 'video':
      setError('video', !isValidVideoUrl(formState.videourl),
        'Adaugă un link valid (YouTube, TikTok, Instagram, Google Drive sau Vimeo)');
      break;
  }
}

/** Запускає всі перевірки (спочатку позначає всі поля як touched) */
function validateAll() {
  const fields = ['fname','lname','dob','city','email','phone','cat','genre','story','video'];
  fields.forEach(id => { touched.add(id); validateField(id); });
  ['cb1','cb2','cb3'].forEach(id => setError(id, !formState[id], 'Acordul este necesar'));
  return isFormValid();
}

function isFormValid() {
  return !!(
    isValidName(formState.fname) &&
    isValidName(formState.lname) &&
    formState.city &&
    isPhone(formState.phone) &&
    isEmail(formState.email) &&
    checkAge(formState.dob).valid &&
    formState.cat &&
    formState.genre &&
    formState.story.length >= 100 &&
    isValidVideoUrl(formState.videourl) &&
    formState.cb1 && formState.cb2 && formState.cb3
  );
}

/* ============================================================
   5. INPUT BINDING
   ============================================================ */

function bindInputs() {

  // Прості текстові поля — спільний input + blur
  ['lname', 'city', 'genre'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { formState[id] = e.target.value.trim(); validateField(id); });
    el.addEventListener('blur',  () => { touched.add(id); validateField(id); });
  });

  // Ім'я і прізвище — розширена валідація
  ['fname', 'lname'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { formState[id] = e.target.value.trim(); validateField(id); });
    el.addEventListener('blur',  () => { touched.add(id); validateField(id); });
  });

  // Email
  const emailEl = document.getElementById('email');
  if (emailEl) {
    emailEl.addEventListener('input', e => { formState.email = e.target.value.trim(); validateField('email'); });
    emailEl.addEventListener('blur',  () => { touched.add('email'); validateField('email'); });
  }

  // Телефон — live форматування
  const phoneEl = document.getElementById('phone');
  if (phoneEl) {
    phoneEl.addEventListener('input', e => {
      const formatted = formatPhone(e.target.value);
      e.target.value  = formatted;
      formState.phone = formatted;
      validateField('phone');
    });
    phoneEl.addEventListener('blur', () => { touched.add('phone'); validateField('phone'); });
  }

  // Дата народження — Safari підтримує лише 'change'
  const dobEl = document.getElementById('dob');
  if (dobEl) {
    dobEl.addEventListener('change', e => { formState.dob = e.target.value; touched.add('dob'); validateField('dob'); });
    dobEl.addEventListener('blur',   () => { touched.add('dob'); validateField('dob'); });
  }

  // Категорія
  document.getElementById('cat')?.addEventListener('change', e => {
    formState.cat = e.target.value; touched.add('cat'); validateField('cat');
  });

  // Textarea — з лічильником символів
  const storyEl = document.getElementById('story');
  if (storyEl) {
    storyEl.addEventListener('input', e => {
      formState.story = e.target.value.trimEnd();
      updateCharCount();
      validateField('story');
    });
    storyEl.addEventListener('blur', () => { touched.add('story'); validateField('story'); });
  }

  // URL відео
  const videourlEl = document.getElementById('videourl');
  if (videourlEl) {
    videourlEl.addEventListener('input', e => {
      formState.videourl = e.target.value.trim();
      touched.add('video');
      validateField('video');
    });
    videourlEl.addEventListener('blur', () => { touched.add('video'); validateField('video'); });
  }

  // Чекбокси
  ['cb1','cb2','cb3','cb4'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', e => { formState[id] = e.target.checked; });
  });
}

/** Оновлює лічильник символів під textarea */
function updateCharCount() {
  const val   = document.getElementById('story')?.value ?? '';
  const count = val.trimEnd().length;
  const el    = document.getElementById('story-count');
  if (!el) return;
  el.textContent = `(${count} / min. 100)`;
  el.style.color = count >= 100 ? 'var(--gold)' : 'var(--muted)';
}

/* ============================================================
   6. SUBMIT
   ============================================================ */

function submitForm() {
  if (!validateAll()) {
    const firstErr = document.querySelector('.has-error');
    if (firstErr) scrollToEl(firstErr);
    return;
  }

  const btn = document.getElementById('btnSubmit');
  if (btn) { btn.textContent = 'Se trimite...'; btn.disabled = true; }

  // TODO: замінити setTimeout на реальний fetch() до бекенду
  console.warn('[RUMUN-FACTOR] submitForm: using fake delay — replace with real API call before going live.');
  setTimeout(() => {
    const number = '#RF-' + Math.floor(100000 + Math.random() * 900000);
    const numEl  = document.getElementById('successNumber');
    if (numEl) numEl.textContent = number;

    // CSS керує visibility через класи — JS тільки додає/знімає їх
    const formBody = document.getElementById('formBody');
    if (formBody) formBody.classList.add('hidden');

    const screen = document.getElementById('successScreen');
    if (screen) {
      screen.classList.add('show');
      screen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 800);
}

/* ============================================================
   7. UTILITY
   ============================================================ */

/** Плавний скрол до елемента з урахуванням висоти sticky nav */
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
   8. NAVIGATION
   ============================================================ */

function closeNav() {
  const menu   = document.getElementById('navMenu');
  const toggle = document.getElementById('navToggle');
  menu?.classList.remove('open');
  if (toggle) {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
}

/* ============================================================
   9. SITE LINKS
   Підставляє URL з конфігу SITE у всі [data-link] елементи.
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
   10. COUNTDOWN TIMER
   ============================================================ */

function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const unit = (n, label) =>
    `<span class="cd-unit"><b>${String(n).padStart(2, '0')}</b><em>${label}</em></span>`;

  function tick() {
    const diff = new Date(SITE.deadline) - new Date();
    if (diff <= 0) {
      el.innerHTML = '<span class="cd-over">Înscrierile s-au închis</span>';
      return;
    }
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
   11. FAQ ACCORDION
   ============================================================ */

function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    const ans = item.querySelector('.faq-answer');
    if (!btn || !ans) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Закриваємо всі відкриті
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
   12. INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Hamburger
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  toggle?.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Smooth-scroll — nav і footer використовують [data-target]
  document.querySelectorAll('a[data-target]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); scrollToId(a.dataset.target); closeNav(); });
  });

  // Nav CTA
  document.getElementById('navCtaBtn')?.addEventListener('click', () => scrollToId('register'));

  // Hero кнопки
  document.getElementById('btn-register')?.addEventListener('click', () => scrollToId('register'));
  document.getElementById('btn-how')?.addEventListener('click',      () => scrollToId('how'));

  // Форма
  document.getElementById('btnSubmit')?.addEventListener('click', submitForm);
  document.getElementById('btnRestart')?.addEventListener('click', () => location.reload());

  // Модулі
  bindInputs();
  updateCharCount();
  applySiteLinks();
  startCountdown();
  initFaq();
});
