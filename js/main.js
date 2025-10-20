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
    // Используем более надежный способ получения данных пользователя
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    
    if (!user) {
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Не удалось получить данные пользователя. Пожалуйста, откройте приложение через Telegram.</p></div>';
        tg.close();
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

// --- Загрузка справочников ---
function loadReferenceLists() {
    callApi('getReferenceLists', null, populateLists, (err) => {
        tg.showAlert('Не удалось загрузить справочники: ' + (err.message || err.toString()));
    });
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

        // Настройка главной кнопки
        tg.MainButton.setText('Показать превью');
        tg.MainButton.onClick(handleSubmit);
        tg.MainButton.show();

        // Основная логика запускается после инициализации Telegram
        logAndAuth();
        loadReferenceLists();

        setupFormEventListeners();
        setupModalEventListeners();
        setupProfileEventListeners();
        
        document.getElementById('date').value = new Date().toISOString().slice(0, 10);
        loadDraft();

    } catch (e) {
        console.error('Ошибка инициализации Telegram WebApp:', e);
        document.body.innerHTML = '<div style="text-align: center; padding: 20px; font-family: sans-serif;"><h1>Ошибка</h1><p>Это приложение предназначено для работы внутри Telegram.</p></div>';
    }
});
