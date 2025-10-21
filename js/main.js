/**
 * @file main.js
 * @description Главный файл: инициализация, аутентификация, запуск.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
const APP_VERSION = '2.0-beta (Fast & Sync)';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null;
let _REPORT = {};

// --- Аутентификация и инициализация ---
function logAndAuth() {
    const user = tg.initDataUnsafe?.user || null;
    if (!user) {
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Не удалось получить данные. Пожалуйста, откройте приложение через Telegram.</p></div>';
        try { tg.close(); } catch(e) {}
        return;
    }

    _TG_ID = user.id || '';
    _TG_USERNAME = user.username || '';
    const telegramFullName = (user.first_name + ' ' + (user.last_name || '')).trim();

    callApi('logAppOpen', { tgId: _TG_ID, username: _TG_USERNAME });

    const localName = localStorage.getItem('driverName');

    if (localName) {
        // Обычный вход: имя есть в кэше
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${localName}`;
        initializeApp();
    } else {
        // "Холодный старт": кэш пуст, идем на сервер
        callApi('getDriverName', { tgId: _TG_ID }, (resp) => {
            if (resp && resp.driverName) {
                // Случай "Втихаря": пользователь есть, но зашел с нового устройства
                localStorage.setItem('driverName', resp.driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${resp.driverName}`;
                initializeApp();
            } else {
                // Новый пользователь: на сервере его нет
                handleNewUserRegistration(telegramFullName);
            }
        }, (err) => {
             tg.showAlert('Критическая ошибка при проверке пользователя. Попробуйте позже.');
             console.error(err);
        });
    }
}

// --- Загрузка данных и настройка UI ---
function initializeApp() {
    loadReferenceLists(); 
    loadProjectHistory();
    loadDraft();
    syncLocalCache(); // Фоновая синхронизация отчетов
    updateFormValidationState();
}

function loadReferenceLists() {
    const cachedLists = localStorage.getItem('referenceLists');
    if (cachedLists) {
        try { populateLists(JSON.parse(cachedLists)); } catch(e) {}
    }
    callApi('getReferenceLists', null, 
        (freshLists) => {
            populateLists(freshLists);
            localStorage.setItem('referenceLists', JSON.stringify(freshLists));
        }, 
        (err) => {
            console.error('Ошибка загрузки справочников:', err.message);
            if (!cachedLists) tg.showAlert('Не удалось загрузить справочники.');
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

        setupFormEventListeners();
        setupModalEventListeners();
        setupProfileEventListeners();
        setupFormValidationListeners();
        
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('appVersion').innerText = `v. ${APP_VERSION}`;
        
    } catch (e) {
        console.error('Ошибка инициализации TWA:', e);
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Приложение предназначено для работы внутри Telegram.</p></div>';
    }
});
