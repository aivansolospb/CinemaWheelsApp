/**
 * @file main.js
 * @description Главный файл: инициализация, аутентификация, запуск.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
const APP_VERSION = '2.4 (Cache-First Loading)';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null;
let _REPORT = {};
let _isInitialized = false;

// --- Аутентификация и инициализация ---
function handshake() {
    const user = tg.initDataUnsafe?.user || null;
    if (!user) {
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Не удалось получить данные. Пожалуйста, откройте приложение через Telegram.</p></div>';
        try { tg.close(); } catch(e) {}
        return;
    }

    _TG_ID = user.id || '';
    _TG_USERNAME = user.username || '';
    const telegramFullName = (user.first_name + ' ' + (user.last_name || '')).trim();

    // Сначала показываем имя из кэша, если оно есть
    const localName = localStorage.getItem('driverName');
    if (localName) {
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${localName}`;
    }

    // Запрашиваем актуальные данные с сервера
    callApi('handshake', { tgId: _TG_ID, username: _TG_USERNAME }, 
    (resp) => {
        if (resp.driverName) {
            // Пользователь существует, обновляем локальные данные
            if (localName !== resp.driverName) {
                localStorage.setItem('driverName', resp.driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${resp.driverName}`;
            }
            localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(resp.reports || []));
            initializeApp();
        } else {
            // Новый пользователь
            handleNewUserRegistration(telegramFullName);
        }
    }, 
    (err) => {
         tg.showAlert('Критическая ошибка при инициализации: ' + (err.message || 'Сервер не отвечает.'));
         // Если сервер упал, но есть кэш - даем работать с ним
         if (localName) initializeApp();
    });
}

// --- Загрузка данных и настройка UI ---
function initializeApp() {
    if (_isInitialized) return;
    
    // Сначала загружаем справочники, потом все остальное
    loadReferenceLists(() => {
        loadProjectHistory();
        loadDraft();
        updateFormValidationState();
        _isInitialized = true;
    });
}

function loadReferenceLists(callback) {
    let hasCalledCallback = false;
    const cachedLists = localStorage.getItem('referenceLists');

    // Шаг 1: Мгновенно загрузить из кэша и разблокировать приложение
    if (cachedLists) {
        try { 
            populateLists(JSON.parse(cachedLists)); 
            if (callback) {
                callback();
                hasCalledCallback = true;
            }
        } catch(e) {
            console.error("Failed to parse cached lists", e);
        }
    }

    // Шаг 2: В фоне запросить свежие данные
    callApi('getReferenceLists', null, 
        (freshLists) => {
            // Обновить UI и localStorage свежими данными
            populateLists(freshLists);
            localStorage.setItem('referenceLists', JSON.stringify(freshLists));
            // Если кэша не было, разблокировать приложение сейчас
            if (!hasCalledCallback && callback) {
                callback();
            }
        }, 
        (err) => {
            console.error('Ошибка фоновой загрузки справочников:', err.message);
            // Если кэша не было и произошла ошибка, все равно разблокировать
            if (!hasCalledCallback && callback) {
                callback();
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

        handshake();

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

