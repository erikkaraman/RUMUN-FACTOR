/* ============================================================
   1. STATE
   ============================================================ */

const formState = {
  fname: '', lname: '', dob: '', city: '', email: '', phone: '',
  cat: '', genre: '', story: '',
  videourl: '', videofile: null,
  cb1: false, cb2: false, cb3: false, cb4: false,
};

/* ============================================================
   2. HELPERS
   ============================================================ */

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

function isVideoValid() {
  return formState.videourl !== '' || formState.videofile !== null;
}

function scrollToEl(el) {
  if (!el) return;
  const navH = document.querySelector('nav')?.offsetHeight ?? 0;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ============================================================
   3. ERROR STATE
   ============================================================ */

function setError(fieldId, show, msg) {
  const f = document.getElementById('f-' + fieldId);
  if (!f) return;
  const err = f.querySelector('.field-error');
  if (!err) return;

  if (show) {
    f.classList.add('has-error');
    f.classList.remove('valid');
    if (msg) err.textContent = msg;
    err.style.display = 'block';
  } else {
    f.classList.remove('has-error');
    err.style.display = 'none';
  }
}

/* Показуємо помилку лише якщо поле вже "торкнули" (blur або спроба сабміту) */
const touched = new Set();

function validateField(id) {
  if (!touched.has(id)) return;

  switch (id) {
    case 'fname':  setError('fname', !formState.fname); break;
    case 'lname':  setError('lname', !formState.lname); break;
    case 'city':   setError('city',  !formState.city);  break;
    case 'phone':  setError('phone', !isPhone(formState.phone),  'Формат: +40 7xx xxx xxx або 07xx xxx xxx'); break;
    case 'email':  setError('email', !isEmail(formState.email),  'Некоректний email'); break;
    case 'dob':    setError('dob',   !isAdult(formState.dob),    'Мінімальний вік — 16 років'); break;
    case 'cat':    setError('cat',   !formState.cat,             'Оберіть категорію'); break;
    case 'genre':  setError('genre', !formState.genre); break;
    case 'story':  setError('story', formState.story.length < 100, 'Мінімум 100 символів'); break;
    case 'video':  setError('video', !isVideoValid(),             'Додайте посилання або завантажте файл'); break;
  }
}

/* Повна валідація всіх полів (при сабміті — торкаємо всі) */
function validateAll() {
  const allFields = ['fname','lname','dob','city','email','phone','cat','genre','story','video'];
  allFields.forEach(id => touched.add(id));
  allFields.forEach(id => validateField(id));

  ['cb1','cb2','cb3'].forEach(id => {
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
   4. INPUT BINDING
   ============================================================ */

function bindInputs() {

  // Текстові поля — step 1
  ['fname', 'lname', 'city', 'phone', 'email'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
      formState[id] = e.target.value.trim();
      validateField(id);
    });
    el.addEventListener('blur', () => {
      touched.add(id);
      validateField(id);
    });
  });

  // Дата — Safari стріляє тільки 'change'
  const dobEl = document.getElementById('dob');
  if (dobEl) {
    dobEl.addEventListener('change', e => {
      formState.dob = e.target.value;
      touched.add('dob');
      validateField('dob');
    });
    dobEl.addEventListener('blur', () => {
      touched.add('dob');
      validateField('dob');
    });
  }

  // Категорія
  document.getElementById('cat')?.addEventListener('change', e => {
    formState.cat = e.target.value;
    touched.add('cat');
    validateField('cat');
  });

  // Жанр
  const genreEl = document.getElementById('genre');
  if (genreEl) {
    genreEl.addEventListener('input', e => {
      formState.genre = e.target.value.trim();
      validateField('genre');
    });
    genreEl.addEventListener('blur', () => {
      touched.add('genre');
      validateField('genre');
    });
  }

  // Textarea "Про себе"
  const storyEl = document.getElementById('story');
  if (storyEl) {
    storyEl.addEventListener('input', e => {
      formState.story = e.target.value.trimEnd();
      updateCount();
      validateField('story');
    });
    storyEl.addEventListener('blur', () => {
      touched.add('story');
      validateField('story');
    });
  }

  // Відео URL
  const videourlEl = document.getElementById('videourl');
  if (videourlEl) {
    videourlEl.addEventListener('input', e => {
      formState.videourl = e.target.value.trim();
      touched.add('video');
      validateField('video');
    });
  }

  // Файл відео
  document.getElementById('videofile')?.addEventListener('change', e => {
    const file = e.target.files[0];
    touched.add('video');

    if (!file) {
      formState.videofile = null;
      updateFileDrop(null);
      validateField('video');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('Файл занадто великий. Максимум — 500 МБ');
      e.target.value = '';
      formState.videofile = null;
      updateFileDrop(null);
      validateField('video');
      return;
    }

    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      alert('Невірний формат. Підтримуються MP4 та MOV');
      e.target.value = '';
      formState.videofile = null;
      updateFileDrop(null);
      validateField('video');
      return;
    }

    formState.videofile = file;
    updateFileDrop(file);
    validateField('video');
  });

  // Чекбокси
  ['cb1', 'cb2', 'cb3', 'cb4'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', e => {
      formState[id] = e.target.checked;
    });
  });
}

/* Оновлює лічильник символів */
function updateCount() {
  const val   = document.getElementById('story')?.value ?? '';
  const count = val.trimEnd().length;
  const el    = document.getElementById('story-count');
  if (!el) return;
  el.textContent = `(${count} / мін. 100)`;
  el.style.color = count >= 100 ? 'var(--gold)' : 'var(--muted)';
}

/* Оновлює вигляд зони завантаження файлу */
function updateFileDrop(file) {
  const textEl = document.getElementById('fileDropText');
  const dropEl = document.getElementById('fileDrop');
  if (!textEl || !dropEl) return;

  if (file) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    textEl.innerHTML = `<span class="file-drop-icon file-drop-icon--ok">✓</span><span>${file.name} · ${sizeMB} МБ</span>`;
    dropEl.classList.add('has-file');
  } else {
    textEl.innerHTML = `<span class="file-drop-icon">↑</span><span>Натисни або перетягни файл сюди</span>`;
    dropEl.classList.remove('has-file');
  }
}

/* ============================================================
   5. DRAG & DROP
   ============================================================ */

function bindDragDrop() {
  const drop = document.getElementById('fileDrop');
  if (!drop) return;

  ['dragenter', 'dragover'].forEach(ev => {
    drop.addEventListener(ev, e => {
      e.preventDefault();
      drop.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(ev => {
    drop.addEventListener(ev, e => {
      e.preventDefault();
      drop.classList.remove('drag-over');
    });
  });

  drop.addEventListener('drop', e => {
    const file = e.dataTransfer?.files[0];
    if (!file) return;

    const input = document.getElementById('videofile');

    if (file.size > 500 * 1024 * 1024) {
      alert('Файл занадто великий. Максимум — 500 МБ');
      return;
    }
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      alert('Невірний формат. Підтримуються MP4 та MOV');
      return;
    }

    formState.videofile = file;
    touched.add('video');
    updateFileDrop(file);
    validateField('video');

    // Синхронізуємо з input якщо браузер підтримує DataTransfer
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (input) input.files = dt.files;
    } catch (_) {}
  });
}

/* ============================================================
   6. SUBMIT
   ============================================================ */

function submitForm() {
  if (!validateAll()) {
    // Знаходимо перший елемент з помилкою і скролимо до нього
    const firstErr = document.querySelector('.has-error');
    if (firstErr) scrollToEl(firstErr);
    return;
  }

  const btn = document.getElementById('btnSubmit');
  if (btn) {
    btn.textContent = 'Відправка...';
    btn.disabled    = true;
  }

  setTimeout(() => {
    const num = '#RF-' + Math.floor(100000 + Math.random() * 900000);
    const successNum = document.getElementById('success-num');
    if (successNum) successNum.textContent = num;

    // Ховаємо форму
    const formBody = document.getElementById('formBody');
    if (formBody) formBody.style.display = 'none';

    // Показуємо success screen
    const s = document.getElementById('success');
    if (s) {
      s.classList.add('show');
      s.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 800);
}

/* ============================================================
   7. NAVIGATION
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
   8. INIT
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

  // Submit button
  document.getElementById('btnSubmit')?.addEventListener('click', () => submitForm());

  // Init
  bindInputs();
  bindDragDrop();
  updateCount();
});
