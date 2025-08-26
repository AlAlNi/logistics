// ============================
// Минималистичная логика формы
// ============================

// Список городов для автокомплита (обрезан до популярных, можно расширить)
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
  'Новочеркасск','Березники','Кисловодск','Ессентуки','Пятигорск','Абакан','Невинномысск',
  'Димитровград','Батайск','Новотроицк','Ноябрьск','Каменск-Уральский'
];

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

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

// Маска телефона: +7 (___) ___-__-__
function phoneMask(value) {
  const digits = value.replace(/\D/g,'');
  let norm = digits.replace(/^8/, '').replace(/^7/, '');
  let out = '+7 (';
  let i = 0;
  for (const c of norm) {
    if (i === 3) out += ') ';
    else if (i === 6 || i === 8) out += '-';
    out += c; i++; if (i >= 10) break;
  }
  return out;
}

// Сегодняшняя дата в ISO (для min)
function todayIso() {
  const d = new Date(); d.setHours(0,0,0,0);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

// Валидация
function rules(applicantType) {
  const base = {
    applicantType: v => !v ? 'Выберите тип заявки' : null,
    fullName: v => !v?.trim() ? 'Поле «Имя» обязательно' : (v.trim().length < 2 ? 'Имя слишком короткое' : null),
    phone: v => {
      if (!v?.trim()) return 'Поле «Телефон» обязательно';
      const digits = v.replace(/\D/g,'');
      if (!digits.startsWith('7') && !digits.startsWith('8')) return 'Начните с 7 или 8';
      if (digits.replace(/^8/,'').replace(/^7/,'').length !== 10) return 'Введите 10 цифр после кода';
      return null;
    },
    email: v => {
      if (!v) return null;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(v) ? null : 'Неверный email';
    }
  };

  const onlyRu = v => {
    if (!v?.trim()) return 'Заполните поле';
    return /^[а-яёА-ЯЁ\-\.\s]+$/.test(v) ? null : 'Только русские буквы и дефис';
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

function setFieldError(id, msg) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (!input || !err) return;
  if (msg) {
    input.classList.add('error'); err.textContent = msg;
  } else {
    input.classList.remove('error'); err.textContent = '';
  }
}

function validateAll() {
  const r = rules(state.data.applicantType);
  let has = false;
  Object.keys(r).forEach(id => {
    const val = id === 'applicantType'
      ? (document.querySelector('input[name="applicantType"]:checked')?.value || '')
      : (document.getElementById(id)?.value ?? '');
    const msg = r[id](val);
    setFieldError(id, msg);
    if (msg) has = true;
  });
  $('#errorAlert').hidden = !has;
  if (has) {
    const first = $('.input.error, .select.error, .textarea.error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return !has;
}

function clearErrors() {
  $$('.input, .select, .textarea').forEach(el => el.classList.remove('error'));
  $$('.error').forEach(el => { if (el.id !== 'errorAlert') el.textContent = ''; });
  $('#errorAlert').hidden = true;
}

function applyTypeVisibility(type) {
  const show = !!type;
  $('#contactSection').hidden = !show;
  $('#formActions').hidden = !show;

  if (type === 'shipper') {
    $('#shipperSection').hidden = false; $('#carrierSection').hidden = true;
    $('#submitText').textContent = 'Найти транспорт';
  } else if (type === 'carrier') {
    $('#shipperSection').hidden = true; $('#carrierSection').hidden = false;
    $('#submitText').textContent = 'Предложить услугу';
  } else {
    $('#shipperSection').hidden = true; $('#carrierSection').hidden = true;
  }
}

function collectForm() {
  const ids = ['applicantType','fullName','phone','email','cargoType','cargoWeight','departureDate',
    'fromAddress','toAddress','cargoDescription','vehicleType','maxWeight','availableRoutes','pricePerKm'];
  ids.forEach(id => {
    if (id === 'applicantType') {
      state.data[id] = (document.querySelector('input[name="applicantType"]:checked')?.value) || '';
    } else {
      const el = document.getElementById(id);
      if (el) state.data[id] = el.value;
    }
  });
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
  $('#successMessage').hidden = true;
  $('#applicationForm').hidden = false;
}

// Автокомплит
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
      el.className = 'ac-item';
      el.setAttribute('role', 'option');
      el.innerHTML = `<span>📍</span><span>${city}</span>`;
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

document.addEventListener('DOMContentLoaded', () => {
  // Минимум логики — без переключателя темы: уважаем системную.
  // Маска телефона
  const phone = $('#phone');
  if (phone) {
    phone.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      const prev = e.target.value.length;
      e.target.value = phoneMask(e.target.value);
      const diff = e.target.value.length - prev;
      e.target.selectionEnd = Math.max(0, (pos || 0) + diff);
    });
  }

  // Дата: не раньше сегодня
  const dep = $('#departureDate');
  if (dep) dep.min = todayIso();

  // Автокомплит
  initAutocomplete('fromAddress');
  initAutocomplete('toAddress');

  // Выбор роли
  $$('#shipper, #carrier').forEach(r => {
    r.addEventListener('change', (e) => {
      state.data.applicantType = e.target.value;
      applyTypeVisibility(e.target.value);
      clearErrors();
      setFieldError('applicantType', state.data.applicantType ? null : 'Выберите тип заявки');
    });
  });

  // Живая валидация после blur
  $$('#cargoForm input, #cargoForm select, #cargoForm textarea').forEach(el => {
    el.addEventListener('blur', () => {
      state.touched[el.id] = true;
      const r = rules(state.data.applicantType);
      if (r[el.id]) setFieldError(el.id, r[el.id](el.value));
    });
    el.addEventListener('input', () => {
      if (!state.touched[el.id]) return;
      const r = rules(state.data.applicantType);
      if (r[el.id]) setFieldError(el.id, r[el.id](el.value));
    });
  });

  // Отправка формы
  $('#cargoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    collectForm();
    if (!validateAll()) return;

    state.isSubmitting = true;
    const btn = $('#submitButton');
    btn.disabled = true;

    // Имитация запроса (замените на fetch)
    await new Promise(r => setTimeout(r, 900));
    console.log('Submitted form data:', state.data);

    // Успех
    $('#applicationForm').hidden = true;
    $('#successMessage').hidden = false;

    state.isSubmitting = false;
    btn.disabled = false;
  });

  // Очистка
  $('#clearButton').addEventListener('click', resetForm);

  // Новая заявка
  $('#newApplicationButton').addEventListener('click', resetForm);
});
