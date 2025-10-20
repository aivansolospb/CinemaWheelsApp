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

// --- Загрузка справочников ---
function loadReferenceLists() {
    callApi('getReferenceLists', null, populateLists, (err) => {
        alert('Не удалось загрузить справочники: ' + (err.message || err.toString()));
    });
}

// --- Основной запуск приложения ---
document.addEventListener('DOMContentLoaded', () => {
    initTelegramWebApp();
    logAndAuth();
    loadReferenceLists();

    setupFormEventListeners();
    setupModalEventListeners();
    setupProfileEventListeners();
    setupEditEventListeners();
    
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
    loadDraft();
});

