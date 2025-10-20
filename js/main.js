/**
 * @file main.js
 * @description Главный файл: инициализация TWA, запуск загрузки данных, установка глобальных слушателей.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
let _ACCESS_METHOD = 'Неизвестно';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null; // Данные для режима редактирования
let _REPORT = {}; // Глобальный объект для хранения данных отчета перед отправкой

// --- Инициализация TWA и темы ---
function initTelegramWebApp() {
    try {
        tg.ready();
        tg.expand();
        document.documentElement.style.colorScheme = tg.colorScheme;
        tg.onEvent('themeChanged', () => {
            document.documentElement.style.colorScheme = tg.colorScheme;
        });
    } catch (e) {
        console.error('Telegram WebApp script error', e);
    }
}

// --- Логирование и аутентификация ---
function logAndAuth() {
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    _ACCESS_METHOD = user ? 'Telegram' : 'Browser (Direct Link)';
    _TG_ID = user ? (user.id || '') : '';
    _TG_USERNAME = user ? (user.username || '') : '';

    try {
        const openInfo = { accessMethod: _ACCESS_METHOD, tgId: _TG_ID, username: _TG_USERNAME };
        callApi('logAppOpen', openInfo, () => {}, (err) => {
            console.error('Не удалось отправить лог открытия:', err.message || err);
        });
    } catch (e) {
        console.error('Ошибка подготовки лога открытия:', e);
    }

    let driverName = localStorage.getItem('driverName');
    if (!driverName) {
        handleNewUserRegistration();
    } else {
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
        loadProjectHistory();
    }
}

/**
 * ИЗМЕНЕНО: Новая логика загрузки справочников с кэшированием на фронте.
 */
function loadReferenceLists() {
    const LISTS_CACHE_KEY = 'referenceListsCache';
    const TIMESTAMP_KEY = 'referenceListsTimestamp';
    const CACHE_DURATION_HOURS = 6;
    const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000;

    let isPopulatedFromCache = false;

    // 1. Попробовать загрузить из кэша
    try {
        const cachedData = localStorage.getItem(LISTS_CACHE_KEY);
        const cacheTimestamp = parseInt(localStorage.getItem(TIMESTAMP_KEY), 10);
        if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION_MS)) {
            console.log('Загрузка справочников из кэша...');
            populateLists(JSON.parse(cachedData));
            isPopulatedFromCache = true;
        }
    } catch (e) {
        console.error('Ошибка чтения кэша справочников:', e);
    }

    // 2. Всегда запрашивать свежие данные с бэкенда
    console.log('Запрос свежих справочников с бэкенда...');
    callApi('getReferenceLists', null, 
        (freshLists) => { // Успех
            console.log('Свежие справочники получены.');
            // Сохраняем свежие данные в кэш
            localStorage.setItem(LISTS_CACHE_KEY, JSON.stringify(freshLists));
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
            
            // Если форма еще не была заполнена из кэша, заполняем ее сейчас
            if (!isPopulatedFromCache) {
                populateLists(freshLists);
            }
        },
        (error) => { // Ошибка
            console.error('Не удалось загрузить справочники с сервера:', error.message || error);
            // Если не удалось загрузить, а в кэше ничего нет, показываем ошибку
            if (!isPopulatedFromCache) {
                alert('Не удалось загрузить справочники. Проверьте интернет и перезагрузите форму.');
            }
        }
    );
}

// --- Основной запуск приложения ---
document.addEventListener('DOMContentLoaded', () => {
    initTelegramWebApp();
    logAndAuth();
    loadReferenceLists(); // Запускаем новую функцию загрузки

    // Установка глобальных слушателей
    setupFormEventListeners();
    setupModalEventListeners();
    setupProfileEventListeners();
    setupEditEventListeners();
    
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
});

