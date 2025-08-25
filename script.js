// -----------------------------
// Набор городов для автокомплита
// -----------------------------
const RUSSIAN_CITIES = [
  'Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Казань','Нижний Новгород',
  'Челябинск','Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь',
  'Волгоград','Краснодар','Саратов','Тюмень','Тольятти','Ижевск','Барнаул','Ульяновск',
  'Иркутск','Хабаровск','Ярославль','Владивосток','Махачкала','Томск','Оренбург',
  'Кемерово','Новокузнецк','Рязань','Астрахань','Набережные Челны','Пенза','Липецк',
  'Тула','Киров','Чебоксары','Калининград','Брянск','Курск','Иваново','Магнитогорск',
  'Тверь','Ставрополь','Симферополь','Белгород','Архангельск','Владимир','Сочи','Курган',
  'Смоленск','Калуга','Чита','Орёл','Волжский','Череповец','Владикавказ','Мурманск',
  'Сургут','Вологда','Тамбов','Стерлитамак','Грозный','Якутск','Кострома','Комсомольск-на-Амуре',
  'Петрозаводск','Таганрог','Нижневартовск','Йошкар-Ола','Братск','Новороссийск','Дзержинск',
  'Шахты','Нижнекамск','Орск','Ангарск','Балашиха','Благовещенск','Прокопьевск','Химки',
  'Псков','Бийск','Энгельс','Рыбинск','Балаково','Северодвинск','Армавир','Подольск',
  'Королёв','Сызрань','Норильск','Золотое Кольцо','Петропавловск-Камчатский','Камышин',
  'Новочеркасск','Березники','Кисловодск','Ессентуки','Пятигорск','Железнодорожный',
  'Абакан','Невинномысск','Димитровград','Батайск','Камень-на-Оби','Новотроицк','Ноябрьск',
  'Каменск-Уральский'
];

// -----------------------------
// Утилиты
// -----------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const setHidden = (el, hidden) => { if (!el) return; el.hidden = !!hidden; };

// Маска телефона: +7 (___) ___-__-__
function phoneMask(value) {
  const digits = value.replace(/\D/g, '');
  let out = '+7 (';
  let i = 0;

  // если пользователь начинает с 8 или 7 — нормализуем
  const norm = digits.replace(/^8/, '').replace(/^7/, '');

  for (const c of norm) {
    if (i === 3) out += ') ';
    else if (i === 6 || i === 8) out += '-';
    out += c;
    i++;
    if (i >= 10) break;
  }
  return out;
}

// Плавная прокрутка к первому ошибочному полю
function scrollToFirstError() {
  const firstError = $('.input.error, .select.error, .textarea.error');
  if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Сегодняшняя дата для min атрибута
function todayIso() {
  const d = new Date();
  d.setHours(0,0,0,0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

// -----------------------------
// Валидация
// -----------------------------
function getRules(applicantType) {
  const base = {
    applicantType: v => !v ? 'Выберите тип заявки' : null,
    fullName: v => {
      if (!v?.trim()) return 'Поле «Имя» обязательно';
      if (v.trim().length < 2) return 'Имя должно быть не короче 2 символов';
      return null;
    },
    phone: v => {
      if (!v?.trim()) return 'Поле «Телефон» обязательно';
      const digits = v.replace(/\D/g, '');
      if (!digits.startsWith('7') && !digits.startsWith('8')) return 'Номер должен начинаться с 7 или 8';
      if (digits.replace(/^8/, '').replace(/^7/, '').length !== 10) return 'Введите 10 цифр после кода страны';
      return null;
    },
    email: v => {
      if (!v) return null;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(v) ? null : 'Неверный формат email';
    }
  };

  const onlyRu = v => {
    if (!v?.trim()) return 'Заполните поле';
    const re = /^[а-яёА-ЯЁ\-\.\s]+$/;
    return re.test(v) ? null : 'Только русские буквы и дефис';
  };

  if (applicantType === 'shipper') {
    return {
      ...base,
      cargoType: v => !v ? 'Выберите тип груза' : null,
      cargoWeight: v => !v ? 'Укажите вес' : null,
      departureDate: v => {
        if (!v) return 'Укажите дату';
        const inDate = new Date(v); inDate.setHours(0,0,0,0);
        const now = new Date(); now.setHours(0,0,0,0);
        return inDate < now ? 'Дата не может быть в прошлом' : null;
      },
      fromAddress: onlyRu,
      toAddress: onlyRu
    };
  }

  if (applicantType === 'carrier') {
    return {
      ...base,
      vehicleType: v => !v ? 'Выберите тип транспорта' : null,
      maxWeight: v => !v ? 'Укажите грузоподъёмность' : null,
      availableRoutes: v => !v?.trim() ? 'Опишите маршруты' : null
    };
  }

  return base;
}

function setFieldError(id, error) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (!input || !err) return;

  if (error) {
    input.classList.add('error');
    err.textContent = error;
  } else {
    input.classList.remove('error');
    err.textContent = '';
  }
}

// -----------------------------
// Автокомплит
// -----------------------------
function initAutocomplete(inputId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(`${inputId}-dropdown`);
  if (!input || !dropdown) return;

  let items = [];
  let index = -1;

  function close() {
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
    index = -1;
  }

  function render(list) {
    dropdown.innerHTML = '';
    list.forEach((city, i) => {
      const el = document.createElement('div');
      el.className = 'autocomplete-item';
      el.setAttribute('role', 'option');
      el.innerHTML = `<span aria-hidden="true">📍</span><span>${city}</span>`;
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = city;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        close();
      });
      dropdown.appendChild(el);
    });
    if (list.length) dropdown.classList.add('show'); else close();
  }

  input.addEventListener('input', e => {
    const v = e.target.value.trim().toLowerCase();
    if (v.length < 2) { close(); return; }
    items = RUSSIAN_CITIES.filter(c => c.toLowerCase().includes(v)).slice(0, 10);
    render(items);
  });

  input.addEventListener('keydown', e => {
    const options = Array.from(dropdown.children);
    if (!options.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = Math.min(index + 1, options.length - 1);
      options.forEach((o, i) => o.classList.toggle('selected', i === index));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = Math.max(index - 1, 0);
      options.forEach((o, i) => o.classList.toggle('selected', i === index));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (index >= 0) {
        input.value = items[index];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        close();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  input.addEventListener('blur', () => setTimeout(close, 150));
}

// -----------------------------
// Основная логика формы
// -----------------------------
const state = {
  data: {
    applicantType: '',
    fullName: '',
    phone: '',
    email: '',
    cargoType: '',
    cargoWeight: '',
    departureDate: '',
    fromAddress: '',
    toAddress: '',
    cargoDescription: '',
    vehicleType: '',
    maxWeight: '',
    availableRoutes: '',
    pricePerKm: ''
  },
  touched: {},
  isSubmitting: false
};

function applyTypeVisibility(type) {
  const contact = document.getElementById('contactSection');
  const shipper = document.getElementById('shipperSection');
  const carrier = document.getElementById('carrierSection');
  const actions = document.getElementById('formActions');
  const submitText = document.getElementById('submitText');

  const show = !!type;
  setHidden(contact, !show);
  setHidden(actions, !show);

  if (type === 'shipper') {
    setHidden(shipper, false); setHidden(carrier, true);
    submitText.textContent = 'Найти транспорт';
  } else if (type === 'carrier') {
    setHidden(shipper, true); setHidden(carrier, false);
    submitText.textContent = 'Предложить услугу';
  } else {
    setHidden(shipper, true); setHidden(carrier, true);
  }
}

function collectForm() {
  const fields = [
    'applicantType','fullName','phone','email','cargoType','cargoWeight','departureDate',
    'fromAddress','toAddress','cargoDescription','vehicleType','maxWeight','availableRoutes','pricePerKm'
  ];
  fields.forEach(id => {
    const input = document.getElementById(id) || document.querySelector(`[name="${id}"]:checked`);
    if (!input) return;
    if (id === 'applicantType') state.data[id] = (document.querySelector('input[name="applicantType"]:checked')?.value) || '';
    else state.data[id] = input.value;
  });
}

function validateAll() {
  const rules = getRules(state.data.applicantType);
  const ids = Object.keys(rules);
  let hasErrors = false;

  ids.forEach(id => {
    const value = id === 'applicantType'
      ? (document.querySelector('input[name="applicantType"]:checked')?.value || '')
      : (document.getElementById(id)?.value ?? '');
    const err = rules[id](value);
    setFieldError(id, err);
    if (err) hasErrors = true;
  });

  document.getElementById('errorAlert').hidden = !hasErrors;
  if (hasErrors) scrollToFirstError();
  return !hasErrors;
}

function clearErrors() {
  $$('.input, .select, .textarea').forEach(el => el.classList.remove('error'));
  $$('.error').forEach(el => { if (el.id !== 'errorAlert') el.textContent = ''; });
  $('#errorAlert').hidden = true;
}

function resetForm() {
  state.data = {
    applicantType: '',
    fullName: '',
    phone: '',
    email: '',
    cargoType: '',
    cargoWeight: '',
    departureDate: '',
    fromAddress: '',
    toAddress: '',
    cargoDescription: '',
    vehicleType: '',
    maxWeight: '',
    availableRoutes: '',
    pricePerKm: ''
  };
  state.touched = {};
  $('#cargoForm').reset();
  applyTypeVisibility('');
  clearErrors();

  // Видимость карточек
  setHidden($('#successMessage'), true);
  setHidden($('#applicationForm'), false);
}

// -----------------------------
// Инициализация
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Тема
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  $('#themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('theme', cur);
  });

  // Маска телефона
  const phone = $('#phone');
  if (phone) {
    phone.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      const prevLen = e.target.value.length;
      e.target.value = phoneMask(e.target.value);
      // попытка приблизительно сохранить курсор
      const diff = e.target.value.length - prevLen;
      e.target.selectionEnd = Math.max(0, (pos || 0) + diff);
    });
  }

  // Дата min = сегодня
  const dep = $('#departureDate');
  if (dep) dep.min = todayIso();

  // Автокомплит
  initAutocomplete('fromAddress');
  initAutocomplete('toAddress');

  // Слушатели выбора роли
  $$('#shipper, #carrier').forEach(r => {
    r.addEventListener('change', (e) => {
      state.data.applicantType = e.target.value;
      applyTypeVisibility(e.target.value);
      clearErrors();
      // Подсветим только ошибку по роли если пусто
      setFieldError('applicantType', state.data.applicantType ? null : 'Выберите тип заявки');
    });
  });

  // Ввод в полях — живая валидация после первого blur
  $$('#cargoForm input, #cargoForm select, #cargoForm textarea').forEach(el => {
    el.addEventListener('blur', () => {
      state.touched[el.id] = true;
      const rules = getRules(state.data.applicantType);
      if (rules[el.id]) {
        const err = rules[el.id](el.value);
        setFieldError(el.id, err);
      }
    });
    el.addEventListener('input', () => {
      if (state.touched[el.id]) {
        const rules = getRules(state.data.applicantType);
        if (rules[el.id]) {
          const err = rules[el.id](el.value);
          setFieldError(el.id, err);
        }
      }
    });
  });

  // Отправка
  $('#cargoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    collectForm();
    const ok = validateAll();
    if (!ok) return;

    state.isSubmitting = true;
    const btn = $('#submitButton');
    btn.classList.add('loading');
    btn.disabled = true;

    // Имитируем запрос
    await new Promise(r => setTimeout(r, 1200));
    console.log('Submitted form data:', state.data);

    // Успех
    setHidden($('#applicationForm'), true);
    setHidden($('#successMessage'), false);

    state.isSubmitting = false;
    btn.classList.remove('loading');
    btn.disabled = false;
  });

  // Очистить
  $('#clearButton').addEventListener('click', resetForm);

  // Новая заявка
  $('#newApplicationButton').addEventListener('click', resetForm);
});
