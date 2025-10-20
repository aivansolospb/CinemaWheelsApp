/**
 * @file main.js
 * @description Главный файл: инициализация, запуск TWA, регистрация пользователя, установка слушателей событий.
 */

// --- Глобальные переменные ---
const tg = window.Telegram.WebApp;
const DRAFT_KEY = 'reportDraft'; 
const API_URL = 'https://script.google.com/macros/s/AKfycbzQB13KwQTcixThKikyas74sHNAwysIiANLa46ZbpZPV05nD7Wsd7fwqMHAikH5ySQ3Jg/exec';

// --- Переменные состояния ---
let _ACCESS_METHOD = 'Неизвестно';
let _TG_ID = '';
let _TG_USERNAME = '';
let _EDIT_MODE_DATA = null; // Хранит данные отчета в режиме редактирования
let _REPORT = {}; // Хранит объект отчета для превью и отправки

// --- Инициализация приложения ---
(function initTWA() {
    try {
        tg.ready();
        tg.expand();
        document.documentElement.style.colorScheme = tg.colorScheme;
        tg.onEvent('themeChanged', () => {
            document.documentElement.style.colorScheme = tg.colorScheme;
        });
    } catch (e) {
        console.error('Ошибка инициализации Telegram WebApp:', e);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Получаем данные пользователя
    const user = tg.initDataUnsafe?.user || tg.initData?.user || null;
    _ACCESS_METHOD = user ? 'Telegram' : 'Browser (Direct Link)'; 
    _TG_ID = user ? (user.id || '') : '';
    _TG_USERNAME = user ? (user.username || '') : '';

    // 2. Отправляем лог об открытии приложения
    logAppOpen();
    
    // 3. Проверяем регистрацию пользователя
    checkUserRegistration();

    // 4. Устанавливаем все слушатели событий
    setupEventListeners();
});

function logAppOpen() {
    try {
        const openInfo = { accessMethod: _ACCESS_METHOD, tgId: _TG_ID, username: _TG_USERNAME };
        callApi('logAppOpen', openInfo, () => {}, () => {});
    } catch (e) {
        console.error('Ошибка подготовки лога открытия:', e);
    }
}

function checkUserRegistration() {
    let driverName = localStorage.getItem('driverName');
    if (!driverName) {
        handleNewUserRegistration();
    } else {
        document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
        loadInitialData();
    }
}

function handleNewUserRegistration(promptMessage) {
    let driverName = prompt(promptMessage || 'Пожалуйста, введите ваше ФИО (это нужно только один раз):', '');
    
    if (driverName && driverName.trim()) {
        driverName = driverName.trim();
        const userInfo = { driverName: driverName, tgId: _TG_ID, username: _TG_USERNAME };
        
        callApi('notifyOfNewUser', userInfo,
            (resp) => { // Успех
                localStorage.setItem('driverName', driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
                loadInitialData();
            },
            (err) => { // Ошибка
                if (err && err.error === 'name_taken') {
                    handleNewUserRegistration(err.message || 'Это ФИО уже занято. Пожалуйста, введите другое.');
                } else {
                    alert('Произошла критическая ошибка регистрации: ' + (err.message || err.toString()));
                    tg.close();
                }
            }
        );
    } else {
        alert('Имя обязательно для отчетов. Пожалуйста, перезагрузите форму и введите имя.');
        tg.close();
    }
}

function loadInitialData() {
    callApi('getReferenceLists', null, populateLists, (err) => { 
        alert('Не удалось загрузить справочники: ' + (err.message || err.toString())); 
    });
    loadProjectHistory();
}

function setupEventListeners() {
    setupFormEventListeners();
    setupModalEventListeners();
    setupProfileEventListeners();
    setupEditEventListeners();
    setupDraftEventListeners();
}

