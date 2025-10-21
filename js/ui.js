/**
 * @file ui.js
 * @description Логика для управления элементами UI (модальные окна, блоки).
 */

function setupModalEventListeners() {
    document.getElementById('editBtn').addEventListener('click', () => {
        document.getElementById('modalPreview').style.display = 'none';
    });
    document.getElementById('sendBtn').addEventListener('click', sendReport);
    
    document.getElementById('cancelEditListBtn').addEventListener('click', () => {
        document.getElementById('modalEditList').style.display = 'none';
    });

    document.getElementById('cancelReasonBtn').addEventListener('click', () => {
        document.getElementById('modalReason').style.display = 'none';
    });

    document.getElementById('submitReasonBtn').addEventListener('click', () => {
        const reason = document.getElementById('reasonInput').value.trim();
        document.getElementById('modalReason').style.display = 'none';
        if (window.reasonCallback) window.reasonCallback(reason);
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', hideConfirmModal);
}

function resetSendButton() {
    const sendBtn = document.getElementById('sendBtn');
    const editBtn = document.getElementById('editBtn');
    sendBtn.disabled = false;
    sendBtn.innerText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';
    editBtn.disabled = false;
}

function showConfirmModal(title, text, callback) {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmText').innerText = text;
    document.getElementById('modalConfirm').style.display = 'flex';

    const okBtn = document.getElementById('confirmOkBtn');
    const handler = (isOk) => {
        hideConfirmModal();
        callback(isOk);
        okBtn.replaceWith(okBtn.cloneNode(true)); // Remove event listener
    };
    
    okBtn.addEventListener('click', () => handler(true), { once: true });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => handler(false), { once: true });
}

function hideConfirmModal() {
    document.getElementById('modalConfirm').style.display = 'none';
}

function showReasonModal(callback) {
    window.reasonCallback = callback;
    document.getElementById('reasonInput').value = '';
    document.getElementById('modalReason').style.display = 'flex';
}

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
