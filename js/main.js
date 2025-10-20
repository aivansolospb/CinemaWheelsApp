/**
 * @file main.js
 * @description Главный файл: инициализация, валидация, запуск.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
const APP_VERSION = 'Profile Layout Fix';
let _ACCESS_METHOD = 'Неизвестно';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null;
let _REPORT = {};
// --- КОНСТАНТА ДЛЯ АДМИН-ФУНКЦИЙ ---
const SHOW_ADMIN_FEATURES = true;

// --- Логирование и аутентификация ---
function logAndAuth() {
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    
    if (!user) {
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Не удалось получить данные. Пожалуйста, откройте приложение через Telegram.</p></div>';
        try { tg.close(); } catch(e) {}
        return;
    }

    _ACCESS_METHOD = 'Telegram';
    _TG_ID = user.id || '';
    _TG_USERNAME = user.username || '';

    callApi('logAppOpen', { accessMethod: _ACCESS_METHOD, tgId: _TG_ID, username: _TG_USERNAME });

    let driverName = localStorage.getItem('driverName');
    if (!driverName) {
        handleNewUserRegistration();
    } else {
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
        loadProjectHistory();
    }
}

// --- Загрузка справочников с кэшированием ---
function loadReferenceLists() {
    const cachedLists = localStorage.getItem('referenceLists');
    if (cachedLists) {
        try {
            populateLists(JSON.parse(cachedLists));
        } catch(e) { console.error("Ошибка парсинга кэша", e); }
    }

    callApi('getReferenceLists', null, 
        (freshLists) => {
            populateLists(freshLists);
            localStorage.setItem('referenceLists', JSON.stringify(freshLists));
        }, 
        (err) => {
            console.error('Ошибка загрузки справочников с сервера:', err.message);
            if (!cachedLists) {
                 tg.showAlert('Сетевая ошибка или API недоступен.');
            }
        }
    );
}

// --- Основной запуск приложения ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        tg.ready();
        tg.expand();
        
        document.documentElement.style.colorScheme = tg.colorScheme;
        tg.onEvent('themeChanged', () => { document.documentElement.style.colorScheme = tg.colorScheme; });

        tg.MainButton.setText('Предпросмотр');
        tg.MainButton.onClick(() => {
            if (isFormValid()) {
                handleSubmit();
            } else {
                triggerInvalidFormAnimation();
            }
        });
        tg.MainButton.show();

        logAndAuth();
        loadReferenceLists(); 

        setupFormEventListeners();
        setupModalEventListeners();
        setupProfileEventListeners();
        setupFormValidationListeners(); // Инициализация валидации
        
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('appVersion').innerText = `v. ${APP_VERSION}`;
        
    } catch (e) {
        console.error('Ошибка инициализации TWA:', e);
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Приложение предназначено для работы внутри Telegram.</p></div>';
    }
});

