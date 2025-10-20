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

function showOptionalBlock(blockId, btnId) {
    document.getElementById(blockId).style.display = 'block';
    if (document.getElementById(btnId)) {
        document.getElementById(btnId).style.display = 'none';
    }
}

/**
 * НОВАЯ ФУНКЦИЯ: Скрывает опциональный блок, очищает его поля и показывает кнопку "Добавить".
 */
function hideOptionalBlock(blockId, addBtnId) {
    document.getElementById(blockId).style.display = 'none';
    document.getElementById(addBtnId).style.display = 'block';

    const block = document.getElementById(blockId);
    const inputs = block.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'number') {
            input.value = '0';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });
    
    if (blockId === 'trailerBlock') {
         document.getElementById('trailerTimeInputs').style.display = 'none';
         document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
         document.getElementById('trailerStart').value = '';
         document.getElementById('trailerEnd').value = '';
    }

    saveDraft(); // Пересохраняем черновик после изменения
}

function resetOptionalBlocksVisibility() {
    hideOptionalBlock('trailerBlock', 'addTrailerBtn');
    hideOptionalBlock('kmBlock', 'addKmBtn');
    hideOptionalBlock('commentBlock', 'addCommentBtn');
}

function resetAndFillOptionalBlocks(report) {
    resetOptionalBlocksVisibility(); 

    if (report.trailer && report.trailer !== 'Нет прицепа') {
        showOptionalBlock('trailerBlock', 'addTrailerBtn');
        document.getElementById('trailerSelect').value = report.trailer;
        
        if (report.trailerStart && (report.trailerStart !== report.shiftStart || report.trailerEnd !== report.shiftEnd)) {
            showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
            document.getElementById('trailerStart').value = report.trailerStart;
            document.getElementById('trailerEnd').value = report.trailerEnd;
        }
    }
    
    if (report.km > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    }
    
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    }
}

