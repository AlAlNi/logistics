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

// Класс для управления приложением
class CargoApp {
  constructor() {
    this.formData = {
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
    
    this.errors = {};
    this.touched = {};
    this.isSubmitting = false;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.initAutocomplete('fromAddress');
    this.initAutocomplete('toAddress');
  }
  
  setupEventListeners() {
    // Радио кнопки для выбора типа заявки
    const radioButtons = document.querySelectorAll('input[name="applicantType"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handleApplicantTypeChange(e.target.value);
      });
    });
    
    // Обработчики для всех полей формы
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
      if (input.name && input.name !== 'applicantType') {
        input.addEventListener('input', (e) => {
          this.handleInputChange(e.target.name, e.target.value);
        });
        
        input.addEventListener('blur', (e) => {
          this.handleFieldBlur(e.target.name);
        });
      }
    });
    
    // Отправка формы
    document.getElementById('cargoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Очистка формы
    document.getElementById('clearButton').addEventListener('click', () => {
      this.resetForm();
    });
    
    // Новая заявка
    document.getElementById('newApplicationButton').addEventListener('click', () => {
      this.resetForm();
      document.getElementById('successMessage').style.display = 'none';
      document.getElementById('applicationForm').style.display = 'block';
    });
  }
  
  handleApplicantTypeChange(value) {
    this.formData.applicantType = value;
    
    // Показать/скрыть секции
    const contactSection = document.getElementById('contactSection');
    const shipperSection = document.getElementById('shipperSection');
    const carrierSection = document.getElementById('carrierSection');
    const formActions = document.getElementById('formActions');
    
    if (value) {
      contactSection.style.display = 'block';
      formActions.style.display = 'flex';
      
      if (value === 'shipper') {
        shipperSection.style.display = 'block';
        carrierSection.style.display = 'none';
        document.getElementById('submitText').textContent = 'Найти транспорт';
      } else {
        shipperSection.style.display = 'none';
        carrierSection.style.display = 'block';
        document.getElementById('submitText').textContent = 'Предложить услугу';
      }
    } else {
      contactSection.style.display = 'none';
      shipperSection.style.display = 'none';
      carrierSection.style.display = 'none';
      formActions.style.display = 'none';
    }
    
    this.updateValidationRules();
  }
  
  handleInputChange(fieldName, value) {
    this.formData[fieldName] = value;
    
    if (this.touched[fieldName]) {
      this.validateField(fieldName, value);
    }
  }
  
  handleFieldBlur(fieldName) {
    this.touched[fieldName] = true;
    this.validateField(fieldName, this.formData[fieldName]);
  }
  
  validateField(fieldName, value) {
    const validationRules = this.getValidationRules();
    const validator = validationRules[fieldName];
    
    if (validator) {
      const error = validator(value, this.formData);
      this.setFieldError(fieldName, error);
      return !error;
    }
    
    return true;
  }
  
  validateForm() {
    const validationRules = this.getValidationRules();
    const newErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const validator = validationRules[fieldName];
      const error = validator(this.formData[fieldName], this.formData);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    // Отметить все поля как тронутые
    Object.keys(validationRules).forEach(fieldName => {
      this.touched[fieldName] = true;
    });
    
    // Показать все ошибки
    Object.keys(newErrors).forEach(fieldName => {
      this.setFieldError(fieldName, newErrors[fieldName]);
    });
    
    // Очистить ошибки для валидных полей
    Object.keys(validationRules).forEach(fieldName => {
      if (!newErrors[fieldName]) {
        this.setFieldError(fieldName, null);
      }
    });
    
    this.errors = newErrors;
    this.updateErrorAlert();
    
    return Object.keys(newErrors).length === 0;
  }
  
  setFieldError(fieldName, error) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement) {
      if (error) {
        errorElement.textContent = error;
        errorElement.classList.add('show');
        if (inputElement) {
          inputElement.classList.add('error');
        }
      } else {
        errorElement.classList.remove('show');
        if (inputElement) {
          inputElement.classList.remove('error');
        }
      }
    }
  }
  
  updateErrorAlert() {
    const errorAlert = document.getElementById('errorAlert');
    const hasErrors = Object.keys(this.errors).length > 0;
    
    if (hasErrors) {
      errorAlert.style.display = 'flex';
    } else {
      errorAlert.style.display = 'none';
    }
  }
  
  getValidationRules() {
    const baseRules = {
      applicantType: (value) => !value ? 'Выберите тип заявки' : null,
      fullName: (value) => {
        if (!value?.trim()) return 'Поле "Имя" обязательно для заполнения';
        if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
        return null;
      },
      phone: (value) => {
        if (!value?.trim()) return 'Поле "Телефон" обязательно для заполнения';
        const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Неверный формат номера телефона';
        return null;
      },
      email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Неверный формат email адреса' : null;
      }
    };
    
    if (this.formData.applicantType === 'shipper') {
      return {
        ...baseRules,
        cargoType: (value) => !value ? 'Выберите тип груза' : null,
        cargoWeight: (value) => {
          if (!value) return 'Выберите примерный вес';
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) return 'Вес должен быть положительным числом';
          return null;
        },
        fromAddress: (value) => {
          if (!value?.trim()) return 'Укажите пункт отправления';
          const cityRegex = /^[а-яёА-ЯЁ\s\-\.]+$/;
          if (!cityRegex.test(value)) return 'Название города должно содержать только русские буквы';
          return null;
        },
        toAddress: (value) => {
          if (!value?.trim()) return 'Укажите пункт назначения';
          const cityRegex = /^[а-яёА-ЯЁ\s\-\.]+$/;
          if (!cityRegex.test(value)) return 'Название города должно содержать только русские буквы';
          return null;
        },
        departureDate: (value) => {
          if (!value) return 'Укажите дату отправления';
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const inputDate = new Date(value);
          if (inputDate < today) return 'Дата не может быть в прошлом';
          return null;
        }
      };
    } else if (this.formData.applicantType === 'carrier') {
      return {
        ...baseRules,
        vehicleType: (value) => !value ? 'Выберите тип транспорта' : null,
        maxWeight: (value) => {
          if (!value) return 'Укажите грузоподъемность';
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) return 'Грузоподъемность должна быть положительным числом';
          return null;
        },
        availableRoutes: (value) => !value?.trim() ? 'Укажите доступные маршруты' : null
      };
    }
    
    return baseRules;
  }
  
  updateValidationRules() {
    // Очистить старые ошибки при смене типа заявки
    this.errors = {};
    this.touched = {};
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
    });
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.classList.remove('error');
    });
    this.updateErrorAlert();
  }
  
  async handleSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    const submitButton = document.getElementById('submitButton');
    const submitText = document.getElementById('submitText');
    
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    submitText.textContent = 'Отправляем...';
    
    // Собрать данные формы
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
      if (element.name) {
        this.formData[element.name] = element.value;
      }
    });
    
    const isValid = this.validateForm();
    
    if (isValid) {
      // Имитация отправки данных
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submitted form data:', this.formData);
      
      // Показать сообщение об успехе
      document.getElementById('applicationForm').style.display = 'none';
      document.getElementById('successMessage').style.display = 'block';
    }
    
    this.isSubmitting = false;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    submitText.textContent = this.formData.applicantType === 'shipper' ? 'Найти транспорт' : 'Предложить услугу';
  }
  
  resetForm() {
    // Очистить данные
    this.formData = {
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
    
    this.errors = {};
    this.touched = {};
    
    // Очистить форму
    document.getElementById('cargoForm').reset();
    
    // Скрыть секции
    document.getElementById('contactSection').style.display = 'none';
    document.getElementById('shipperSection').style.display = 'none';
    document.getElementById('carrierSection').style.display = 'none';
    document.getElementById('formActions').style.display = 'none';
    
    // Очистить ошибки
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
    });
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.classList.remove('error');
    });
    
    this.updateErrorAlert();
  }
  
  // Автокомплит для городов
  initAutocomplete(fieldId) {
    const input = document.getElementById(fieldId);
    const dropdown = document.getElementById(`${fieldId}-dropdown`);
    let selectedIndex = -1;
    let filteredCities = [];
    
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      
      if (value.length >= 2) {
        filteredCities = RUSSIAN_CITIES.filter(city =>
          city.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 10);
        
        this.showDropdown(dropdown, filteredCities, (city) => {
          input.value = city;
          this.handleInputChange(fieldId, city);
          this.hideDropdown(dropdown);
        });
        
        selectedIndex = -1;
      } else {
        this.hideDropdown(dropdown);
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (!dropdown.classList.contains('show') || filteredCities.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex = selectedIndex < filteredCities.length - 1 ? selectedIndex + 1 : selectedIndex;
          this.updateSelection(dropdown, selectedIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : -1;
          this.updateSelection(dropdown, selectedIndex);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            input.value = filteredCities[selectedIndex];
            this.handleInputChange(fieldId, filteredCities[selectedIndex]);
            this.hideDropdown(dropdown);
          }
          break;
        case 'Escape':
          this.hideDropdown(dropdown);
          selectedIndex = -1;
          break;
      }
    });
    
    input.addEventListener('blur', () => {
      // Небольшая задержка чтобы успел сработать клик
      setTimeout(() => this.hideDropdown(dropdown), 150);
    });
    
    input.addEventListener('focus', () => {
      if (input.value.length >= 2 && filteredCities.length > 0) {
        this.showDropdown(dropdown, filteredCities, (city) => {
          input.value = city;
          this.handleInputChange(fieldId, city);
          this.hideDropdown(dropdown);
        });
      }
    });
  }
  
  showDropdown(dropdown, cities, onSelect) {
    dropdown.innerHTML = '';
    
    cities.forEach((city, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <span class="icon">📍</span>
        <span>${city}</span>
      `;
      
      item.addEventListener('click', () => onSelect(city));
      dropdown.appendChild(item);
    });
    
    dropdown.classList.add('show');
  }
  
  hideDropdown(dropdown) {
    dropdown.classList.remove('show');
  }
  
  updateSelection(dropdown, selectedIndex) {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new CargoApp();
});
