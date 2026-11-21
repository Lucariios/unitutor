/* ==========================================================================
   main.js — інтерактивність сайту UniTutor (ЛР4).
   Скрипт підключено в <head> без defer: збережену тему він застосовує ще до
   показу сторінки, тому темна тема не «блимає» світлою. Решта функцій
   запускається після події DOMContentLoaded, коли розмітка вже готова.
   ========================================================================== */

(() => {
  'use strict';

  const root = document.documentElement;

  // ---------- 5. LocalStorage: тема сайту (dark / light) ----------
  const THEME_KEY = 'unitutor-theme';

  // localStorage буває недоступним (приватний режим, заборона сховища):
  // тоді тема просто не запам’ятовується, а сайт працює як звичайно
  function loadTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // сховище недоступне: тема діє до перезавантаження сторінки
    }
  }

  root.classList.toggle('dark-theme', loadTheme() === 'dark');

  // ---------- 2.1. Маніпуляція елементами ----------

  // Усі рейтинги (.rating) від 4,9 виділяються зеленою «пігулкою»
  function highlightTopRatings() {
    document.querySelectorAll('.rating').forEach((rating) => {
      const value = Number.parseFloat(rating.textContent.replace(',', '.'));
      if (value >= 4.9) {
        rating.style.backgroundColor = 'var(--color-accent-100)';
        rating.style.color = 'var(--color-accent-text)';
        rating.style.padding = '0.125rem 0.5rem';
        rating.style.borderRadius = '999px';
      }
    });
  }

  // Новий абзац у кінці <main> з посиланням «Нагору» — лише на довгих сторінках
  function addBackToTop() {
    const main = document.querySelector('main');
    if (!main || main.scrollHeight < window.innerHeight * 1.5) {
      return;
    }
    const link = document.createElement('a');
    link.href = '#top';                       // #top браузер прокручує на початок сторінки
    link.textContent = 'Нагору ↑';
    const paragraph = document.createElement('p');
    paragraph.className = 'container to-top';
    paragraph.append(link);
    main.append(paragraph);
  }

  // ---------- 2.2. Динамічна зміна контенту ----------

  // Поточна дата в підвалі сайту
  function showCurrentDate() {
    const footerBottom = document.querySelector('.footer-bottom');
    if (!footerBottom) {
      return;
    }
    const today = new Date();
    const time = document.createElement('time');
    time.dateTime = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
    time.textContent = today.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    const paragraph = document.createElement('p');
    paragraph.className = 'footer-date';
    paragraph.append('Сьогодні: ', time);
    footerBottom.append(paragraph);
  }

  // «Показати більше»: блок .more-text прихований, кнопка розкриває та згортає його (акордеон)
  function initShowMore() {
    document.querySelectorAll('.more-text').forEach((block, index) => {
      if (!block.id) {
        block.id = `more-text-${index + 1}`;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-more';
      button.setAttribute('aria-controls', block.id);

      const setOpen = (open) => {
        block.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        button.textContent = open ? 'Згорнути' : 'Показати більше';
      };

      button.addEventListener('click', () => setOpen(block.hidden));
      block.after(button);
      setOpen(false);
    });
  }

  // ---------- 3.1. Кнопка «Змінити тему»: перемикає клас dark-theme ----------
  const ICON_MOON = '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/>'
    + '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6'
    + 'M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';

  function initThemeToggle() {
    const header = document.querySelector('.header-inner');
    if (!header) {
      return;
    }
    const logo = header.querySelector('.logo img');
    const logoLight = logo ? logo.getAttribute('src') : '';
    const logoDark = logoLight.replace('logo.svg', 'logo-inverse.svg');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.title = 'Змінити тему';
    button.setAttribute('aria-label', 'Темна тема');

    const render = () => {
      const isDark = root.classList.contains('dark-theme');
      button.setAttribute('aria-pressed', String(isDark));
      button.innerHTML = isDark ? ICON_SUN : ICON_MOON;
      if (logo) {
        logo.src = isDark ? logoDark : logoLight;
      }
    };

    button.addEventListener('click', () => {
      const isDark = root.classList.toggle('dark-theme');
      saveTheme(isDark ? 'dark' : 'light');
      render();
    });

    header.append(button);
    render();
  }

  // ---------- 3.2. Події миші та клавіатури ----------

  // Підсвітка пунктів меню під час наведення: клас is-hovered замість CSS :hover
  function initNavHover() {
    document.querySelectorAll('.nav-list a').forEach((link) => {
      link.addEventListener('mouseenter', () => link.classList.add('is-hovered'));
      link.addEventListener('mouseleave', () => link.classList.remove('is-hovered'));
    });
  }

  // Розмір шрифту сторінки: ArrowUp — більше, ArrowDown — менше (від 80 до 150 %)
  const FONT_STEP = 10;
  const FONT_MIN = 80;
  const FONT_MAX = 150;

  function initFontSizeKeys() {
    let fontSize = 100;
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return;
      }
      // у полях форм і з клавішами-модифікаторами стрілки працюють як зазвичай
      const inField = event.target instanceof Element && event.target.closest('input, select, textarea');
      if (inField || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? FONT_STEP : -FONT_STEP;
      fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize + delta));
      root.style.fontSize = `${fontSize}%`;
    });
  }

  // ---------- 4. Форма звернення: обробка submit і власна валідація ----------
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   // ім’я@домен.зона

  // Кожне правило повертає текст помилки або порожній рядок, якщо значення правильне
  const CONTACT_RULES = {
    name: (value) => {
      if (!value) {
        return 'Вкажіть ім’я.';
      }
      return value.length >= 3 ? '' : 'Ім’я: щонайменше 3 символи.';
    },
    email: (value) => {
      if (!value) {
        return 'Вкажіть електронну пошту.';
      }
      return EMAIL_PATTERN.test(value) ? '' : 'Адреса має містити @ і домен.';
    },
    topic: (value) => (value ? '' : 'Оберіть тему звернення.'),
    message: (value) => {
      if (!value) {
        return 'Опишіть ваше питання.';
      }
      return value.length >= 10 ? '' : 'Повідомлення: від 10 символів.';
    },
  };

  // Червона рамка поля й текст помилки під ним; повертає true, якщо поле з помилкою
  function showFieldError(field, message) {
    const invalid = message !== '';
    const error = field.closest('.field').querySelector('.field-error');
    field.classList.toggle('is-invalid', invalid);
    field.setAttribute('aria-invalid', String(invalid));
    if (error) {
      if (invalid) {
        error.textContent = message;
      }
      error.classList.toggle('is-visible', invalid);
    }
    return invalid;
  }

  function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) {
      return;
    }
    form.noValidate = true;                  // вбудовані підказки браузера вимкнено: перевіряє скрипт

    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.append(status);

    // Дані з усіх полів форми: { name, email, topic, message } без пробілів на краях
    const readForm = () => Object.fromEntries(
      [...new FormData(form)].map(([key, value]) => [key, String(value).trim()]),
    );

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = readForm();
      console.log('Форма звернення:', data);

      const invalidFields = Object.keys(CONTACT_RULES)
        .filter((name) => showFieldError(form.elements[name], CONTACT_RULES[name](data[name])));

      if (invalidFields.length > 0) {
        status.textContent = '';
        form.elements[invalidFields[0]].focus();
        return;
      }
      form.reset();
      status.textContent = 'Форма успішно надіслана!';
    });

    // Поле з помилкою перевіряється знову під час введення: повідомлення зникає,
    // щойно значення стає правильним
    form.addEventListener('input', (event) => {
      const field = event.target;
      status.textContent = '';
      if (field.name in CONTACT_RULES && field.classList.contains('is-invalid')) {
        showFieldError(field, CONTACT_RULES[field.name](field.value.trim()));
      }
    });
  }

  // ---------- Калькулятор заробітку («Стати репетитором»): ставка × години на тиждень ----------
  const WEEKS_IN_MONTH = 4;

  function initEarningsCalculator() {
    const calculator = document.getElementById('earnings-calculator');
    if (!calculator) {
      return;
    }
    const money = new Intl.NumberFormat('uk-UA');

    const update = () => {
      const rate = Math.max(0, Number(calculator.elements.rate.value) || 0);
      const hours = Math.max(0, Number(calculator.elements.hours.value) || 0);
      const perWeek = rate * hours;
      calculator.elements.week.value = `${money.format(perWeek)} грн`;
      calculator.elements.month.value = `${money.format(perWeek * WEEKS_IN_MONTH)} грн`;
    };

    calculator.addEventListener('input', update);
    calculator.addEventListener('submit', (event) => event.preventDefault());
    update();
  }

  // ---------- Запуск після завантаження розмітки ----------
  document.addEventListener('DOMContentLoaded', () => {
    highlightTopRatings();
    addBackToTop();
    showCurrentDate();
    initShowMore();
    initThemeToggle();
    initNavHover();
    initFontSizeKeys();
    initContactForm();
    initEarningsCalculator();
  });
})();
