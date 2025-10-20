/**
 * @file draft.js
 * @description Управление сохранением и загрузкой черновика отчета в localStorage.
 */

const DRAFT_KEY = 'reportDraft';

/**
 * Сохраняет текущее состояние формы в localStorage.
 */
function saveDraft() {
    if (_EDIT_MODE_DATA) return; // Не сохранять черновик в режиме редактирования

    const draftData = {
        date: document.getElementById('date').value,
        project: document.getElementById('project').value,
        tech: document.getElementById('techSelect').value,
        address: document.getElementById('address').value,
        shiftStart: document.getElementById('shiftStart').value,
        shiftEnd: document.getElementById('shiftEnd').value,
        isTrailerVisible: document.getElementById('trailerBlock').style.display === 'block',
        trailer: document.getElementById('trailerSelect').value,
        isCustomTrailerTime: document.getElementById('trailerTimeInputs').style.display === 'block',
        trailerStart: document.getElementById('trailerStart').value,
        trailerEnd: document.getElementById('trailerEnd').value,
        isKmVisible: document.getElementById('kmBlock').style.display === 'block',
        km: document.getElementById('km').value,
        isCommentVisible: document.getElementById('commentBlock').style.display === 'block',
        comment: document.getElementById('comment').value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
}

/**
 * Загружает черновик из localStorage и заполняет форму.
 */
function loadDraft() {
    cancelEdit(false); 

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            document.getElementById('date').value = draftData.date || new Date().toISOString().slice(0, 10);
            document.getElementById('project').value = draftData.project || '';
            document.getElementById('techSelect').value = draftData.tech || '';
            document.getElementById('address').value = draftData.address || '';
            document.getElementById('shiftStart').value = draftData.shiftStart || '';
            document.getElementById('shiftEnd').value = draftData.shiftEnd || '';
            
            // Сброс и восстановление опциональных блоков
            document.getElementById('trailerBlock').style.display = 'none';
            document.getElementById('addTrailerBtn').style.display = 'block';
            document.getElementById('trailerTimeInputs').style.display = 'none';
            document.getElementById('toggleTrailerTimeBtn').style.display = 'block';

            if (draftData.isTrailerVisible) {
                showOptionalBlock('trailerBlock', 'addTrailerBtn');
                document.getElementById('trailerSelect').value = draftData.trailer || '';
                if (draftData.isCustomTrailerTime) {
                    showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn', true);
                    document.getElementById('trailerStart').value = draftData.trailerStart || '';
                    document.getElementById('trailerEnd').value = draftData.trailerEnd || '';
                }
            }
            
            document.getElementById('kmBlock').style.display = 'none';
            document.getElementById('addKmBtn').style.display = 'block';
            if (draftData.isKmVisible) {
                showOptionalBlock('kmBlock', 'addKmBtn');
                document.getElementById('km').value = draftData.km || '0';
            }
            
            document.getElementById('commentBlock').style.display = 'none';
            document.getElementById('addCommentBtn').style.display = 'block';
            if (draftData.isCommentVisible) {
                showOptionalBlock('commentBlock', 'addCommentBtn');
                document.getElementById('comment').value = draftData.comment || '';
            }
            
        } catch (e) {
            console.error("Ошибка загрузки черновика:", e);
            localStorage.removeItem(DRAFT_KEY);
            document.getElementById('date').value = new Date().toISOString().slice(0, 10);
        }
    } else {
        document.getElementById('date').value = new Date().toISOString().slice(0, 10);
    }
}
