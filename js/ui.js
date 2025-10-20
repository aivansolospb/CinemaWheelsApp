/**
 * @file ui.js
 * @description Логика для управления элементами интерфейса (опциональные блоки, модальные окна).
 */

// --- Опциональные блоки в форме ---

function showOptionalBlock(blockId, btnId) {
    const block = document.getElementById(blockId);
    const btn = document.getElementById(btnId);
    if (block) block.style.display = 'block';
    if (btn) btn.style.display = 'none';
}

function hideOptionalBlock(blockId, btnId) {
    const block = document.getElementById(blockId);
    const btn = document.getElementById(btnId);
    if (block) block.style.display = 'none';
    if (btn) btn.style.display = 'block';
    
    const inputs = block.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
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
    
    if (report.km > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    }
    
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    }
}

// --- Логика модальных окон (HTML) ---

function setupModalEventListeners() {
    const saveReasonBtn = document.getElementById('saveReasonBtn');
    const cancelReasonBtn = document.getElementById('cancelReasonBtn');

    if(saveReasonBtn) saveReasonBtn.addEventListener('click', () => {
        const reason = document.getElementById('reasonInput').value.trim();
        const modal = document.getElementById('modalReason');
        if (modal.callback) {
            modal.callback(reason);
        }
        modal.style.display = 'none';
    });

    if(cancelReasonBtn) cancelReasonBtn.addEventListener('click', () => {
        const modal = document.getElementById('modalReason');
        if (modal.callback) {
            modal.callback(null); // Передаем null при отмене
        }
        modal.style.display = 'none';
    });
}

function showReasonModal(callback) {
    const modal = document.getElementById('modalReason');
    document.getElementById('reasonInput').value = '';
    modal.callback = callback; // Сохраняем колбэк
    modal.style.display = 'flex';
    document.getElementById('reasonInput').focus();
}

function showProfileModal(options) {
    const { isRegistration } = options;
    const modal = document.getElementById('modalProfile');
    const title = document.getElementById('profileModalTitle');
    const input = document.getElementById('profileNameInput');
    const label = document.getElementById('profileNameLabel');
    const hint = document.getElementById('profileHint');
    const menu = document.getElementById('profileMenu');
    const saveBtn = document.getElementById('saveNameBtn');

    input.value = localStorage.getItem('driverName') || '';
    saveBtn.disabled = false;
    saveBtn.innerText = 'Сохранить';

    if (isRegistration) {
        title.innerText = 'Регистрация';
        label.innerText = 'Введите ваше ФИО';
        hint.innerText = 'Это необходимо для подписи ваших отчетов. Имя можно будет изменить позже.';
        menu.style.display = 'none';
        input.style.display = 'block';
        label.style.display = 'block';
    } else {
        title.innerText = 'Профиль водителя';
        menu.style.display = 'block';
        input.style.display = 'none';
        label.style.display = 'none';
        hint.innerText = `Текущее ФИО: ${localStorage.getItem('driverName') || ''}`;
        saveBtn.style.display = 'none'; // Скрываем кнопку сохранения в меню
        document.getElementById('cancelNameBtn').innerText = 'Закрыть';
    }
    modal.style.display = 'flex';
}

function showProfileChangeNameUI() {
    document.getElementById('profileModalTitle').innerText = 'Смена ФИО';
    document.getElementById('profileMenu').style.display = 'none';
    document.getElementById('profileNameInput').style.display = 'block';
    document.getElementById('profileNameLabel').style.display = 'block';
    document.getElementById('saveNameBtn').style.display = 'block';
    document.getElementById('cancelNameBtn').innerText = 'Отмена';
    document.getElementById('profileHint').innerText = 'При изменении, имя будет обновлено во всех ваших прошлых отчетах.';
    document.getElementById('profileNameInput').focus();
}

function hideProfileModal() {
    const modal = document.getElementById('modalProfile');
    modal.style.display = 'none';
}
