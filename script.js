/* ============================================================
   1. STATE
   ============================================================ */

const formState = {
  step1: { fname: '', lname: '', dob: '', city: '', email: '', phone: '' },
  step2: { cat: '', genre: '', song: '', story: '' },
  step3: { videourl: '', videofile: null },
  step4: { cb1: false, cb2: false, cb3: false, cb4: false },
};

let currentStep     = 1;
let maxUnlockedStep = 1;

/* ============================================================
   2. HELPERS
   ============================================================ */

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v) {
  if (!v) return false;
  // Прибираємо пробіли, дужки, дефіси — потім перевіряємо румунський формат
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

function isVideoValid() {
  return formState.step3.videourl !== '' || formState.step3.videofile !== null;
}

/* Скролимо до елемента з відступом на висоту sticky nav */
function scrollToEl(el) {
  if (!el) return;
  const navH = document.querySelector('nav')?.offsetHeight ?? 0;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* Встановлюємо/знімаємо стан помилки на полі */
function setError(fieldId, show, msg = '') {
  const f = document.getElementById('f-' + fieldId);
  if (!f) return;
  const err = f.querySelector('.field-error');
  if (!err) return;

  if (show) {
    f.classList.add('has-error');
    if (msg) err.textContent = msg;
    err.style.display = 'block';
  } else {
    f.classList.remove('has-error');
    err.style.display = 'none';
  }
}

/* ============================================================
   3. VALIDATION
   ============================================================ */

/* Перевіряє крок без показу помилок — для стану кнопки */
function isStepValid(step) {
  const d1 = formState.step1;
  const d2 = formState.step2;
  const d4 = formState.step4;

  if (step === 1) return !!(d1.fname && d1.lname && d1.city && isPhone(d1.phone) && isEmail(d1.email) && isAdult(d1.dob));
  if (step === 2) return !!(d2.cat && d2.genre && d2.song && d2.story.length >= 100);
  if (step === 3) return isVideoValid();
  if (step === 4) return !!(d4.cb1 && d4.cb2 && d4.cb3);
  return false;
}

/* Перевіряє крок і показує помилки на полях */
function validateStep(step) {
  if (step === 1) {
    const d = formState.step1;
    setError('fname', !d.fname);
    setError('lname', !d.lname);
    setError('city',  !d.city);
    setError('phone', !isPhone(d.phone),  'Формат: +40 7xx xxx xxx або 07xx xxx xxx');
    setError('email', !isEmail(d.email),  'Некоректний email');
    setError('dob',   !isAdult(d.dob),    'Мінімальний вік — 16 років');
  }

  if (step === 2) {
    const d = formState.step2;
    setError('cat',   !d.cat,                  'Оберіть категорію');
    setError('genre', !d.genre);
    setError('song',  !d.song);
    setError('story', d.story.length < 100,    'Мінімум 100 символів');
  }

  if (step === 3) {
    setError('video', !isVideoValid(), 'Додайте відео');
  }

  if (step === 4) {
    ['cb1', 'cb2', 'cb3'].forEach(id => {
      const f  = document.getElementById('f-' + id);
      const cb = document.getElementById(id);
      if (!f || !cb) return;
      const err = f.querySelector('.field-error');
      if (cb.checked) {
        f.classList.remove('has-error');
        if (err) err.style.display = 'none';
      } else {
        f.classList.add('has-error');
        if (err) err.style.display = 'block';
      }
    });
  }

  return isStepValid(step);
}

/* ============================================================
   4. FORM — INPUT BINDING
   ============================================================ */

function bindInputs() {

  // Step 1 — текстові поля
  ['fname', 'lname', 'city', 'phone', 'email'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      formState.step1[id] = e.target.value.trim();
      validateStep(currentStep);
      updateButtons();
    });
  });

  // Step 1 — дата (Safari не стріляє 'input' на date picker, тільки 'change')
  document.getElementById('dob')?.addEventListener('change', e => {
    formState.step1.dob = e.target.value;
    validateStep(currentStep);
    updateButtons();
  });

  // Step 2 — текстові поля
  ['genre', 'song'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      formState.step2[id] = e.target.value.trim();
      validateStep(currentStep);
      updateButtons();
    });
  });

  // Step 2 — select категорії
  document.getElementById('cat')?.addEventListener('change', e => {
    formState.step2.cat = e.target.value;
    validateStep(currentStep);
    updateButtons();
  });

  // Step 2 — textarea (trimEnd узгоджено з updateCount)
  document.getElementById('story')?.addEventListener('input', e => {
    formState.step2.story = e.target.value.trimEnd();
    updateCount();
    validateStep(currentStep);
    updateButtons();
  });

  // Step 3 — відео URL
  document.getElementById('videourl')?.addEventListener('input', e => {
    formState.step3.videourl = e.target.value.trim();
    validateStep(currentStep);
    updateButtons();
  });

  // Step 3 — файл відео
  document.getElementById('videofile')?.addEventListener('change', e => {
    const file = e.target.files[0];

    if (!file) {
      formState.step3.videofile = null;
      updateButtons();
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('Файл занадто великий. Максимум — 500 МБ');
      e.target.value = '';
      formState.step3.videofile = null;
      updateButtons();
      return;
    }

    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      alert('Невірний формат. Підтримуються MP4 та MOV');
      e.target.value = '';
      formState.step3.videofile = null;
      updateButtons();
      return;
    }

    formState.step3.videofile = file;
    updateButtons();
  });

  // Step 4 — чекбокси
  ['cb1', 'cb2', 'cb3', 'cb4'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', e => {
      formState.step4[id] = e.target.checked;
      updateButtons();
    });
  });
}

/* Оновлює лічильник символів у полі "Твоя історія" */
function updateCount() {
  const val   = document.getElementById('story')?.value ?? '';
  const count = val.trimEnd().length;
  const el    = document.getElementById('story-count');
  if (!el) return;
  el.textContent = `(${count} / мін. 100)`;
  el.style.color = count >= 100 ? 'var(--gold)' : 'var(--muted)';
}

/* Оновлює disabled-стан кнопок "Далі" */
function updateButtons() {
  for (let i = 1; i <= 4; i++) {
    const btn = document.querySelector('#acc' + i + ' .acc-next');
    if (btn) btn.disabled = !isStepValid(i);
  }
}

/* ============================================================
   5. ACCORDION
   ============================================================ */

function openStep(step) {
  // Закриваємо всі body
  document.querySelectorAll('.acc-body').forEach(el => el.classList.remove('open'));
  // Скидаємо active з усіх header
  document.querySelectorAll('.acc-header').forEach(el => el.classList.remove('active'));

  // Відновлюємо done на пройдених кроках
  for (let i = 1; i < step; i++) {
    document.getElementById('h' + i)?.classList.add('done');
  }

  // Відкриваємо потрібний крок
  document.getElementById('b' + step)?.classList.add('open');
  document.getElementById('h' + step)?.classList.add('active');

  currentStep = step;
  updateProgress(step);
}

function nextStep(step) {
  if (!validateStep(step)) return;

  setSummary(step);

  // Позначаємо поточний крок як done
  const num  = document.querySelector('#h' + step + ' .acc-num');
  const head = document.getElementById('h' + step);
  if (num)  num.textContent = '✔';
  if (head) head.classList.add('done');

  if (step < 4) {
    maxUnlockedStep = Math.max(maxUnlockedStep, step + 1);
    openStep(step + 1);

    // Чекаємо завершення accordion transition (~400ms), потім скролимо
    setTimeout(() => {
      scrollToEl(document.getElementById('h' + (step + 1)));
    }, 420);
  }
}

function jumpTo(step) {
  // Назад — завжди можна
  if (step <= currentStep) {
    openStep(step);
    return;
  }
  // Вперед — тільки якщо розблоковано
  if (step <= maxUnlockedStep) {
    openStep(step);
  }
}

/* Заповнює summary в header пройденого кроку */
function setSummary(step) {
  const sum = document.getElementById('sum' + step);
  if (!sum) return;

  let text = '';
  if (step === 1) {
    const d = formState.step1;
    text = `${d.fname} ${d.lname}, ${d.city}`;
  } else if (step === 2) {
    const d = formState.step2;
    text = `${d.cat} · ${d.song}`;
  } else if (step === 3) {
    text = formState.step3.videourl ? '✓ посилання' : '✓ файл';
  }

  sum.textContent = text;
  sum.classList.add('visible');
}

/* ============================================================
   6. PROGRESS BAR
   ============================================================ */

function updateProgress(step) {
  for (let i = 1; i <= 4; i++) {
    const ps  = document.getElementById('ps' + i);
    const pl  = document.getElementById('pl' + i);
    if (!ps) continue;

    const dot = ps.querySelector('.prog-dot');

    ps.classList.remove('active', 'done', 'locked');

    if (i < step)      ps.classList.add('done');
    else if (i === step) ps.classList.add('active');

    if (pl) {
      pl.classList.toggle('done', i < step);
    }

    if (dot) {
      dot.textContent = i < step ? '✓' : i;
    }

    if (i > maxUnlockedStep) {
      ps.classList.add('locked');
    }
  }
}

/* ============================================================
   7. SUBMIT
   ============================================================ */

function submitForm() {
  if (!validateStep(4)) return;

  const btn = document.querySelector('#acc4 .acc-next');
  if (btn) {
    btn.textContent = 'Відправка...';
    btn.disabled    = true;
  }

  setTimeout(() => {
    const num = '#RF-' + Math.floor(100000 + Math.random() * 900000);
    const successNum = document.getElementById('success-num');
    if (successNum) successNum.textContent = num;

    // Ховаємо progress bar і всі accordion
    document.querySelector('.form-progress')?.style.setProperty('display', 'none');
    for (let i = 1; i <= 4; i++) {
      document.getElementById('acc' + i)?.style.setProperty('display', 'none');
    }

    // Показуємо success screen
    const s = document.getElementById('success');
    if (s) {
      s.classList.add('show');
      s.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 800);
}

/* ============================================================
   8. NAVIGATION
   ============================================================ */

function smoothTo(id) {
  scrollToEl(document.getElementById(id));
}

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
   9. INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Hamburger toggle
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  toggle?.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Nav links
  document.querySelectorAll('nav a[data-target]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      smoothTo(a.dataset.target);
      closeNav();
    });
  });

  // Nav CTA
  document.querySelector('.nav-cta')?.addEventListener('click', () => smoothTo('register'));

  // Hero buttons
  document.getElementById('btn-register')?.addEventListener('click', () => smoothTo('register'));
  document.getElementById('btn-how')?.addEventListener('click',      () => smoothTo('how'));

  // Footer nav links
  document.querySelectorAll('footer a[data-target]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      smoothTo(a.dataset.target);
    });
  });

  // Progress bar clicks
  for (let i = 1; i <= 4; i++) {
    document.getElementById('ps' + i)?.addEventListener('click', () => jumpTo(i));
  }

  // Accordion header clicks
  for (let i = 1; i <= 4; i++) {
    document.getElementById('h' + i)?.addEventListener('click', () => jumpTo(i));
  }

  // "Далі" buttons
  document.querySelector('#acc1 .acc-next')?.addEventListener('click', () => nextStep(1));
  document.querySelector('#acc2 .acc-next')?.addEventListener('click', () => nextStep(2));
  document.querySelector('#acc3 .acc-next')?.addEventListener('click', () => nextStep(3));

  // Submit
  document.querySelector('#acc4 .acc-next')?.addEventListener('click', () => submitForm());

  // Init form
  bindInputs();
  openStep(1);
  updateButtons();
  updateProgress(1);
});
