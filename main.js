/**
 * @file main.js
 * @description Главный файл: инициализация, глобальные переменные, запуск приложения и основные слушатели событий.
 */

const tg = window.Telegram.WebApp;
let _ACCESS_METHOD = 'Неизвестно';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null;
let _REPORT = {}; // Объект для хранения данных отчета перед отправкой

// Инициализация темы TWA
(function() {
  try {
    tg.ready();
    if (tg.colorScheme === 'dark') {
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
    tg.onEvent('themeChanged', function() {
      document.documentElement.style.colorScheme = tg.colorScheme;
    });
  } catch (e) { console.error('Telegram WebApp script error', e); }
})();


/**
 * Обработка регистрации нового пользователя
 * @param {string} promptMessage - Сообщение для prompt-диалога
 */
function handleNewUserRegistration(promptMessage) {
    let driverName = prompt(promptMessage || 'Пожалуйста, введите ваше ФИО (это нужно только один раз):', '');
    
    if (driverName && driverName.trim()) {
      driverName = driverName.trim();
      
      try {
        const userInfo = { driverName: driverName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD };
        
        callApi('notifyOfNewUser', userInfo,
          (resp) => { // УСПЕХ
            localStorage.setItem('driverName', driverName);
            document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
            callApi('getReferenceLists', null, populateLists, (err) => { alert('Не удалось загрузить справочники: ' + (err.message || err)); });
            loadDraft(); 
            loadProjectHistory();
          },
          (err) => { // ОШИБКА
            if (err && err.error === 'name_taken') {
              handleNewUserRegistration(err.message || 'Это ФИО уже занято. Пожалуйста, введите другое.');
            } else {
              console.error('Не удалось отправить уведомление о регистрации:', err);
              alert('Произошла критическая ошибка регистрации: ' + (err.message || err.toString()));
              tg.close();
            }
          }
        );
      } catch (e) { console.error('Ошибка подготовки данных для регистрации:', e); tg.close(); }
      
    } else {
      alert('Имя обязательно для отчетов. Пожалуйста, перезагрузите форму и введите имя.');
      tg.close();
    }
}


// --- Основной код, выполняющийся после загрузки DOM ---
document.addEventListener('DOMContentLoaded', () => {
    tg.expand(); 
    
    // 1. Определяем пользователя
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    _ACCESS_METHOD = user ? 'Telegram' : 'Browser (Direct Link)'; 
    _TG_ID = user ? (user.id || '') : '';
    _TG_USERNAME = user ? (user.username || '') : '';

    // 2. Логгируем открытие приложения
    try {
        const openInfo = { accessMethod: _ACCESS_METHOD, tgId: _TG_ID, username: _TG_USERNAME };
        callApi('logAppOpen', openInfo, () => {}, (err) => { console.error('Не удалось отправить лог открытия:', (err.message || err)); });
    } catch (e) { console.error('Ошибка подготовки лога открытия:', e); }

    // 3. Проверяем, зарегистрирован ли пользователь
    let driverName = localStorage.getItem('driverName');
    if (!driverName) {
        handleNewUserRegistration();
    } else {
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
        callApi('getReferenceLists', null, populateLists, (err) => { alert('Не удалось загрузить справочники: ' + (err.message || err.toString())); });
        loadDraft(); 
        loadProjectHistory();
    }

    // 4. Устанавливаем слушатели событий
    document.getElementById('reportForm').addEventListener('submit', (event) => {
        event.preventDefault();
        preparePreview();
    });

    const fieldsToWatch = ['date', 'project', 'techSelect', 'address', 'shiftStart', 'shiftEnd', 'trailerSelect', 'trailerStart', 'trailerEnd', 'km', 'comment'];
    fieldsToWatch.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const eventType = (element.tagName === 'SELECT') ? 'change' : 'input'; 
            element.addEventListener(eventType, saveDraft);
        }
    });

    // Слушатели для UI
    setupUIEventListeners();
    // Слушатели для формы
    setupFormEventListeners();
    // Слушатели для профиля
    setupProfileEventListeners();
    // Слушатели для редактирования
    setupEditEventListeners();
});
