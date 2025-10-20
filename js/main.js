/**
 * @file main.js
 * @description Главный файл: инициализация TWA, запуск загрузки данных, установка глобальных слушателей.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
let _ACCESS_METHOD = 'Неизвестно';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null;
let _REPORT = {};

// --- Логирование и аутентификация ---
function logAndAuth() {
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    
    if (!user) {
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Не удалось получить данные пользователя. Пожалуйста, откройте приложение через Telegram.</p></div>';
        try { tg.close(); } catch(e) {}
        return;
    }

    _ACCESS_METHOD = 'Telegram';
    _TG_ID = user.id || '';
    _TG_USERNAME = user.username || '';

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

// --- Загрузка справочников с кэшированием ---
function loadReferenceLists() {
    // 1. Попробовать загрузить из кэша и сразу отобразить
    const cachedLists = localStorage.getItem('referenceLists');
    if (cachedLists) {
        try {
            console.log("Загрузка списков из кэша...");
            populateLists(JSON.parse(cachedLists));
        } catch(e) {
            console.error("Ошибка парсинга кэшированных списков", e);
        }
    }

    // 2. Отправить запрос на сервер за свежими данными
    callApi('getReferenceLists', null, 
        (freshLists) => { // Успех
            console.log("Списки успешно загружены с сервера.");
            populateLists(freshLists);
            // Сохраняем свежие данные в кэш
            localStorage.setItem('referenceLists', JSON.stringify(freshLists));
        }, 
        (err) => { // Ошибка
            console.error('Не удалось загрузить справочники с сервера:', err.message || err.toString());
            // Если в кэше ничего не было, показываем ошибку
            if (!cachedLists) {
                 tg.showAlert('Сетевая ошибка или API недоступен. Не удалось загрузить справочники.');
            }
            // Если данные из кэша уже отображены, пользователь может продолжать работу.
        }
    );
}

// --- Основной запуск приложения ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        tg.ready();
        tg.expand();
        
        document.documentElement.style.colorScheme = tg.colorScheme;
        tg.onEvent('themeChanged', () => {
            document.documentElement.style.colorScheme = tg.colorScheme;
        });

        tg.MainButton.setText('Показать превью');
        tg.MainButton.onClick(handleSubmit);
        tg.MainButton.show();

        logAndAuth();
        loadReferenceLists(); // Загружает списки (сначала кэш, потом сервер)

        setupFormEventListeners();
        setupModalEventListeners();
        setupProfileEventListeners();
        
        document.getElementById('date').value = new Date().toISOString().slice(0, 10);
        // Загрузка черновика теперь происходит внутри populateLists, чтобы избежать гонки состояний

    } catch (e) {
        console.error('Ошибка инициализации Telegram WebApp:', e);
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Это приложение предназначено для работы внутри Telegram.</p></div>';
    }
});

