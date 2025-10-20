/**
 * @file ui.js
 * @description Логика для управления элементами интерфейса: модальные окна, кнопки, показ/скрытие блоков.
 */

// --- Модальные окна ---
function setupModalEventListeners() {
    document.getElementById('editBtn').addEventListener('click', () => {
        document.getElementById('modalPreview').style.display = 'none';
        resetSendButton();
    });
    document.getElementById('cancelEditListBtn').addEventListener('click', () => {
        document.getElementById('modalEditList').style.display = 'none';
    });
}

// --- Кнопки ---
function resetSendButton() {
    const sendBtn = document.getElementById('sendBtn');
    const editBtn = document.getElementById('editBtn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';
    }
    if (editBtn) {
        editBtn.disabled = false;
    }
}

function resetSaveButton() {
    const saveBtn = document.getElementById('saveNameBtn');
    const cancelBtn = document.getElementById('cancelNameBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Сохранить';
    }
    if (cancelBtn) {
        cancelBtn.disabled = false;
    }
}

// --- Опциональные блоки ---

function showOptionalBlock(blockId, btnId, isNested = false) {
    document.getElementById(blockId).style.display = 'block';
    if (document.getElementById(btnId)) {
        document.getElementById(btnId).style.display = 'none';
    }
}

/**
 * НОВАЯ ФУНКЦИЯ: Скрывает все опциональные блоки и показывает их кнопки "Добавить".
 */
function resetOptionalBlocksVisibility() {
    document.getElementById('trailerBlock').style.display = 'none';
    document.getElementById('addTrailerBtn').style.display = 'block';
    document.getElementById('trailerTimeInputs').style.display = 'none';
    document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
    
    document.getElementById('kmBlock').style.display = 'none';
    document.getElementById('addKmBtn').style.display = 'block';
    
    document.getElementById('commentBlock').style.display = 'none';
    document.getElementById('addCommentBtn').style.display = 'block';
}

/**
 * НОВАЯ ФУНКЦИЯ: Сбрасывает и затем заполняет опциональные блоки данными из отчета.
 * @param {object} report - Объект отчета для заполнения формы.
 */
function resetAndFillOptionalBlocks(report) {
    resetOptionalBlocksVisibility(); // Сначала все скрываем

    // Заполнение прицепа
    if (report.trailer && report.trailer !== 'Нет прицепа') {
        showOptionalBlock('trailerBlock', 'addTrailerBtn');
        document.getElementById('trailerSelect').value = report.trailer;
        
        if (report.trailerStart && (report.trailerStart !== report.shiftStart || report.trailerEnd !== report.shiftEnd)) {
            showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn', true);
            document.getElementById('trailerStart').value = report.trailerStart;
            document.getElementById('trailerEnd').value = report.trailerEnd;
        } else {
            document.getElementById('trailerStart').value = '';
            document.getElementById('trailerEnd').value = '';
        }
    } else {
         document.getElementById('trailerSelect').value = '';
    }
    
    // Заполнение км
    if (report.km > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    } else {
        document.getElementById('km').value = '0';
    }
    
    // Заполнение комментария
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    } else {
         document.getElementById('comment').value = '';
    }
}

