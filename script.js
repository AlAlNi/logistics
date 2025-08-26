// База российских городов для автокомплита
const RUSSIAN_CITIES = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород',
  'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж',
  'Пермь', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
  'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль', 'Владивосток',
  'Махачкала', 'Томск', 'Оренбург', 'Кемерово', 'Новокузнецк', 'Рязань', 'Астрахань',
  'Набережные Челны', 'Пенза', 'Липецк', 'Тула', 'Киров', 'Чебоксары', 'Калининград',
  'Брянск', 'Курск', 'Иваново', 'Магнитогорск', 'Тверь', 'Ставрополь', 'Симферополь',
  'Белгород', 'Архангельск', 'Владимир', 'Сочи', 'Курган', 'Смоленск', 'Калуга',
  'Чита', 'Орёл', 'Волжский', 'Череповец', 'Владикавказ', 'Мурманск', 'Сургут',
  'Вологда', 'Тамбов', 'Стерлитамак', 'Грозный', 'Якутск', 'Кострома', 'Комсомольск-на-Амуре',
  'Петрозаводск', 'Таганрог', 'Нижневартовск', 'Йошкар-Ола', 'Братск', 'Новороссийск',
  'Дзержинск', 'Шахты', 'Нижнекамск', 'Орск', 'Ангарск', 'Балашиха', 'Благовещенск',
  'Прокопьевск', 'Химки', 'Псков', 'Бийск', 'Энгельс', 'Рыбинск', 'Балаково',
  'Северодвинск', 'Армавир', 'Подольск', 'Королёв', 'Сызрань', 'Норильск', 'Золотое Кольцо',
  'Петропавловск-Камчатский', 'Камышин', 'Новочеркасск', 'Березники', 'Кисловодск',
  'Ессентуки', 'Пятигорск', 'Железнодорожный', 'Абакан', 'Невинномысск', 'Димитровград',
  'Батайск', 'Камень-на-Оби', 'Новотроицк', 'Ноябрьск', 'Каменск-Уральский'
];

// Состояние приложения
let formData = {
  applicantType: '',
  fullName: '',
  phone: '',
  email: '',
  cargoType: '',
  cargoWeight: '',
  cargoDescription: '',
  fromAddress: '',
  toAddress: '',
  departureDate: '',
  vehicleType: '',
  maxWeight: '',
  availableRoutes: '',
  pricePerKm: ''
};

let formErrors = {};
let touchedFields = {};

// Валидаторы
const validators = {
  required: (fieldName) => (value) => {
    return !value?.trim() ? `Поле "${fieldName}" обязательно для заполнения` : null;
  },
  
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Неверный формат email адреса' : null;
  },
  
  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    return !phoneRegex.test(value.replace(/\s/g, '')) ? 'Неверный формат номера телефона' : null;
  },
  
  positiveNumber: (fieldName) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) || num <= 0 ? `${fieldName} должен быть положительным числом` : null;
  },
  
  dateNotInPast: (fieldName) => (value) => {
    if (!value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(value);
    return inputDate < today ? `${fieldName} не может быть в прошлом` : null;
  },
  
  minLength: (min, fieldName) => (value) => {
    if (!value) return null;
    return value.length < min ? `${fieldName} должно содержать минимум ${min} символов` : null;
  },
  
  cityFormat: (value) => {
    if (!value) return null;
    const cityRegex = /^[а-яёА-ЯЁ\s\-\.]+$/;
    return !cityRegex.test(value) ? 'Название города должно содержать только русские буквы' : null;
  }
};

// Комбинированная валидация
const combineValidators = (...validatorFuncs) => {
  return (value, formData) => {
    for (const validator of validatorFuncs) {
      const error = validator(value, formData);
      if (error) return error;
    }
    return null;
  };
};

// Правила валидации
const getValidationRules = (applicantType) => {
  const baseRules = {
    applicantType: validators.required('Тип заявки'),
    fullName: combineValidators(
      validators.required('Имя'),
      validators.minLength(2, 'Имя')
    ),
    phone: combineValidators(
      validators.required('Телефон'),
      validators.phone
    ),
    email: validators.email,
  };

  if (applicantType === 'shipper') {
    return {
      ...baseRules,
      cargoType: validators.required('Что везём'),
      cargoWeight: combineValidators(
        validators.required('Примерный вес'),
        validators.positiveNumber('Вес')
      ),
      fromAddress: combineValidators(
        validators.required('Откуда'),
        validators.cityFormat
      ),
      toAddress: combineValidators(
        validators.required('Куда'),
        validators.cityFormat
      ),
      departureDate: combineValidators(
        validators.required('Когда'),
        validators.dateNotInPast('Дата')
      ),
    };
  } else if (applicantType === 'carrier') {
    return {
      ...baseRules,
      vehicleType: validators.required('Тип транспорта'),
      maxWeight: combineValidators(
        validators.required('Грузоподъемность'),
        validators.positiveNumber('Грузоподъемность')
      ),
      availableRoutes: validators.required('Куда ездите'),
    };
  }

  return baseRules;
};

// Функции валидации
const validateField = (fieldName, value, formDataObj = formData) => {
  const rules = getValidationRules(formDataObj.applicantType);
  const validator = rules[fieldName];
  if (!validator) return null;
  
  return validator(value, formDataObj);
};

const validateForm = (formDataObj = formData) => {
  const rules = getValidationRules(formDataObj.applicantType);
  const newErrors = {};
  
  Object.keys(rules).forEach(fieldName => {
    const error = validateField(fieldName, formDataObj[fieldName], formDataObj);
    if (error) {
      newErrors[fieldName] = error;
    }
  });
  
  formErrors = newErrors;
  updateErrorDisplay();
  return Object.keys(newErrors).length === 0;
};

const validateSingleField = (fieldName, value) => {
  const error = validateField(fieldName, value);
  
  if (error) {
    formErrors[fieldName] = error;
  } else {
    delete formErrors[fieldName];
  }
  
  updateFieldError(fieldName);
  return !error;
};

// Обновление отображения ошибок
const updateErrorDisplay = () => {
  Object.keys(formErrors).forEach(fieldName => {
    updateFieldError(fieldName);
  });
  
  // Показать/скрыть общее предупреждение
  const hasErrors = Object.keys(formErrors).length > 0;
  const alertElement = document.getElementById('form-alert');
  if (alertElement) {
    alertElement.style.display = hasErrors ? 'flex' : 'none';
  }
};

const updateFieldError = (fieldName) => {
  const errorElement = document.getElementById(`${fieldName}-error`);
  const inputElement = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
  
  if (errorElement) {
    const error = touchedFields[fieldName] ? formErrors[fieldName] : '';
    errorElement.textContent = error || '';
  }
  
  if (inputElement) {
    if (formErrors[fieldName] && touchedFields[fieldName]) {
      inputElement.classList.add('error');
    } else {
      inputElement.classList.remove('error');
    }
  }
};

// Обработка полей формы
const handleInputChange = (fieldName, value) => {
  formData[fieldName] = value;
  
  if (fieldName !== 'applicantType') {
    validateSingleField(fieldName, value);
  }
  
  // Обновить текст кнопки отправки
  updateSubmitButton();
};

const handleFieldBlur = (fieldName) => {
  touchedFields[fieldName] = true;
  validateSingleField(fieldName, formData[fieldName]);
};

// Обновление кнопки отправки
const updateSubmitButton = () => {
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  
  if (formData.applicantType === 'shipper') {
    btnText.textContent = 'Найти транспорт';
  } else if (formData.applicantType === 'carrier') {
    btnText.textContent = 'Предложить услугу';
  } else {
    btnText.textContent = 'Отправить заявку';
  }
};

// Автокомплит для городов
class CityAutocomplete {
  constructor(inputId) {
    this.input = document.getElementById(inputId);
    this.dropdown = document.getElementById(`${inputId}-dropdown`);
    this.selectedIndex = -1;
    this.filteredCities = [];
    
    this.init();
  }
  
  init() {
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.input.addEventListener('focus', () => this.handleFocus());
    this.input.addEventListener('blur', () => this.handleBlur());
  }
  
  handleInput(e) {
    const value = e.target.value;
    handleInputChange(this.input.name, value);
    
    if (value.length >= 2) {
      this.filteredCities = RUSSIAN_CITIES
        .filter(city => city.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }
  
  handleKeyDown(e) {
    if (!this.dropdown.classList.contains('show') || this.filteredCities.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex < this.filteredCities.length - 1 
          ? this.selectedIndex + 1 
          : this.selectedIndex;
        this.updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : -1;
        this.updateSelection();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectCity(this.filteredCities[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }
  
  handleFocus() {
    if (this.input.value.length >= 2 && this.filteredCities.length > 0) {
      this.showDropdown();
    }
  }
  
  handleBlur() {
    // Небольшая задержка чтобы успел сработать клик по городу
    setTimeout(() => this.hideDropdown(), 150);
  }
  
  showDropdown() {
    this.dropdown.innerHTML = '';
    this.selectedIndex = -1;
    
    this.filteredCities.forEach((city, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>${city}</span>
      `;
      
      item.addEventListener('click', () => this.selectCity(city));
      this.dropdown.appendChild(item);
    });
    
    this.dropdown.classList.add('show');
  }
  
  hideDropdown() {
    this.dropdown.classList.remove('show');
    this.selectedIndex = -1;
  }
  
  updateSelection() {
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  selectCity(city) {
    this.input.value = city;
    handleInputChange(this.input.name, city);
    this.hideDropdown();
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  // Инициализация автокомплита для городов
  new CityAutocomplete('fromAddress');
  new CityAutocomplete('toAddress');
  
  // Обработка радио кнопок
  const radioOptions = document.querySelectorAll('.radio-option');
  const radioInputs = document.querySelectorAll('input[name="applicantType"]');
  
  radioOptions.forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      const radio = option.querySelector('input[type="radio"]');
      radio.checked = true;
      
      // Обновить стили
      radioOptions.forEach(opt => {
        opt.classList.remove('selected-shipper', 'selected-carrier');
      });
      option.classList.add(`selected-${value}`);
      
      // Обновить данные
      handleInputChange('applicantType', value);
      
      // Показать соответствующие поля
      showFormFields(value);
    });
  });
  
  // Обработка всех полей формы
  const formInputs = document.querySelectorAll('input, select, textarea');
  formInputs.forEach(input => {
    if (input.type !== 'radio') {
      input.addEventListener('input', (e) => {
        handleInputChange(e.target.name, e.target.value);
      });
      
      input.addEventListener('blur', (e) => {
        handleFieldBlur(e.target.name);
      });
    }
  });
  
  // Обработка отправки формы
  const form = document.getElementById('cargo-form');
  form.addEventListener('submit', handleSubmit);
  
  // Кнопка очистки
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', clearForm);
  
  // Кнопка сброса после успешной отправки
  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', resetForm);
});

// Показать поля формы в зависимости от типа заявки
const showFormFields = (applicantType) => {
  const formFields = document.getElementById('form-fields');
  const shipperFields = document.getElementById('shipper-fields');
  const carrierFields = document.getElementById('carrier-fields');
  
  formFields.style.display = 'block';
  
  if (applicantType === 'shipper') {
    shipperFields.style.display = 'block';
    carrierFields.style.display = 'none';
  } else if (applicantType === 'carrier') {
    shipperFields.style.display = 'none';
    carrierFields.style.display = 'block';
  }
  
  updateSubmitButton();
};

// Обработка отправки формы
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  
  // Пометить все поля как затронутые
  Object.keys(formData).forEach(field => {
    touchedFields[field] = true;
  });
  
  const isValid = validateForm();
  
  if (isValid) {
    // Симуляция отправки
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Submitted form data:', formData);
    showSuccessScreen();
  }
  
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');
};

// Показать экран успешной отправки
const showSuccessScreen = () => {
  document.getElementById('main-form').style.display = 'none';
  document.getElementById('success-screen').style.display = 'block';
};

// Очистить форму
const clearForm = () => {
  // Сброс данных
  formData = {
    applicantType: '',
    fullName: '',
    phone: '',
    email: '',
    cargoType: '',
    cargoWeight: '',
    cargoDescription: '',
    fromAddress: '',
    toAddress: '',
    departureDate: '',
    vehicleType: '',
    maxWeight: '',
    availableRoutes: '',
    pricePerKm: ''
  };
  
  formErrors = {};
  touchedFields = {};
  
  // Очистить поля формы
  const form = document.getElementById('cargo-form');
  form.reset();
  
  // Сбросить радио кнопки
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach(option => {
    option.classList.remove('selected-shipper', 'selected-carrier');
  });
  
  // Скрыть поля формы
  document.getElementById('form-fields').style.display = 'none';
  
  // Очистить ошибки
  updateErrorDisplay();
};

// Сброс после успешной отправки
const resetForm = () => {
  document.getElementById('success-screen').style.display = 'none';
  document.getElementById('main-form').style.display = 'block';
  clearForm();
};