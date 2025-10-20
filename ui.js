/**
 * @file ui.js
 * @description Управление элементами интерфейса: модальные окна, кнопки, показ/скрытие блоков.
 */

/**
 * Показывает опциональный блок и скрывает кнопку, которая его вызвала.
 * @param {string} blockId - ID блока для показа.
 * @param {string} btnId - ID кнопки для скрытия.
 * @param {boolean} [isNested=false] - Является ли блок вложенным (для особой логики скрытия).
 */
function showOptionalBlock(blockId, btnId, isNested = false) {
    document.getElementById(blockId).style.display = 'block';
    document.getElementById(btnId).style.display = 'none';
    if (isNested) {
        document.getElementById(btnId).style.display = 'none';
    }
}

/**
 * Сбрасывает состояние кнопки отправки.
 */
function resetSendButton() {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('editBtn').disabled = false;
    document.getElementById('sendBtn').innerText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';
}

/**
 * Сбрасывает состояние кнопки сохранения в профиле.
 */
function resetSaveButton() {
    const saveBtn = document.getElementById('saveNameBtn');
    const cancelBtn = document.getElementById('cancelNameBtn');
    saveBtn.disabled = false; 
    cancelBtn.disabled = false;
    saveBtn.innerText = 'Сохранить';
}

/**
 * Устанавливает слушатели событий для элементов UI.
 */
function setupUIEventListeners() {
    // Модальное окно превью
    document.getElementById('editBtn').addEventListener('click', () => {
        document.getElementById('modalPreview').style.display = 'none';
        resetSendButton();
    });
    
    // Модальное окно профиля
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
        document.getElementById('modalProfile').style.display = 'flex';
    });

    document.getElementById('cancelNameBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'none';
        resetSaveButton();
    });

    // Модальное окно списка для редактирования
    document.getElementById('cancelEditListBtn').addEventListener('click', () => {
        document.getElementById('modalEditList').style.display = 'none';
    });
}
