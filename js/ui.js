/**
 * @file ui.js
 * @description Логика для управления элементами UI (модальные окна, блоки).
 */

// --- Управление модальными окнами ---
function setupModalEventListeners() {
    document.getElementById('cancelEditListBtn').addEventListener('click', () => {
        document.getElementById('modalEditList').style.display = 'none';
    });

    document.getElementById('cancelReasonBtn').addEventListener('click', () => {
        document.getElementById('modalReason').style.display = 'none';
    });

    document.getElementById('submitReasonBtn').addEventListener('click', () => {
        const reason = document.getElementById('reasonInput').value.trim();
        document.getElementById('modalReason').style.display = 'none';
        if (window.reasonCallback) {
            window.reasonCallback(reason);
        }
    });
}

function showReasonModal(callback) {
    window.reasonCallback = callback;
    document.getElementById('reasonInput').value = '';
    document.getElementById('modalReason').style.display = 'flex';
}

function showProfileModal({ isRegistration }) {
    const modal = document.getElementById('modalProfile');
    if (isRegistration) {
        showProfileChangeNameUI();
        document.querySelector('#profileChangeName h3').innerText = 'Регистрация';
        document.getElementById('cancelNameBtn').innerText = 'Закрыть';
    } else {
        showProfileMenuUI();
    }
    modal.style.display = 'flex';
}

function hideProfileModal() {
    document.getElementById('modalProfile').style.display = 'none';
    const saveBtn = document.getElementById('saveNameBtn');
    saveBtn.disabled = false;
    saveBtn.innerText = 'Сохранить';
}

function showProfileMenuUI() {
    document.getElementById('profileMenu').style.display = 'block';
    document.getElementById('profileChangeName').style.display = 'none';
}

function showProfileChangeNameUI() {
    document.getElementById('profileMenu').style.display = 'none';
    document.getElementById('profileChangeName').style.display = 'block';
    document.querySelector('#profileChangeName h3').innerText = 'Изменение ФИО';
    document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
    document.getElementById('cancelNameBtn').innerText = 'Отмена';
}

// --- Управление опциональными блоками ---
function showOptionalBlock(blockId, btnId) {
    document.getElementById(blockId).style.display = 'block';
    document.getElementById(btnId).style.display = 'none';
}

function hideOptionalBlock(blockId, btnId) {
    const block = document.getElementById(blockId);
    block.style.display = 'none';
    document.getElementById(btnId).style.display = 'block';
    
    block.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'number') input.value = '0';
        else if (input.tagName === 'SELECT') input.selectedIndex = 0;
        else input.value = '';
    });
    saveDraft();
}

function resetOptionalBlocksVisibility() {
    hideOptionalBlock('trailerBlock', 'addTrailerBtn');
    hideOptionalBlock('kmBlock', 'addKmBtn');
    hideOptionalBlock('commentBlock', 'addCommentBtn');
    document.getElementById('trailerTimeInputs').style.display = 'none';
    document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
}

function resetAndFillOptionalBlocks(report) {
    resetOptionalBlocksVisibility();
    if (report.trailer && report.trailer !== 'Нет прицепа') {
        showOptionalBlock('trailerBlock', 'addTrailerBtn');
        document.getElementById('trailerSelect').value = report.trailer;
        const isCustomTime = report.trailerStart && (report.trailerStart !== report.shiftStart || report.trailerEnd !== report.shiftEnd);
        if (isCustomTime) {
            showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
            document.getElementById('trailerStart').value = report.trailerStart;
            document.getElementById('trailerEnd').value = report.trailerEnd;
        }
    }
    if (report.km && Number(report.km) > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    }
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    }
}

