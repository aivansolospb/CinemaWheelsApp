/**
 * @file draft.js
 * @description Логика для сохранения и загрузки черновика отчета в localStorage.
 */
const DRAFT_KEY = 'reportDraft';
let _IS_LOADING_DRAFT = false; // Флаг для предотвращения перезаписи черновика во время загрузки

function saveDraft() {
    // Не сохраняем черновик в режиме редактирования или во время загрузки другого черновика
    if (_EDIT_MODE_DATA || _IS_LOADING_DRAFT) return;

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

function loadDraft() {
    if (_EDIT_MODE_DATA) return;

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (!savedDraft) return;

    _IS_LOADING_DRAFT = true; // Устанавливаем флаг

    try {
        const draftData = JSON.parse(savedDraft);
        document.getElementById('date').value = draftData.date || new Date().toISOString().slice(0, 10);
        document.getElementById('project').value = draftData.project || '';
        document.getElementById('techSelect').value = draftData.tech || '';
        document.getElementById('address').value = draftData.address || '';
        document.getElementById('shiftStart').value = draftData.shiftStart || '';
        document.getElementById('shiftEnd').value = draftData.shiftEnd || '';

        resetOptionalBlocksVisibility();

        if (draftData.isTrailerVisible) {
            showOptionalBlock('trailerBlock', 'addTrailerBtn');
            document.getElementById('trailerSelect').value = draftData.trailer || '';
            if (draftData.isCustomTrailerTime) {
                showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
                document.getElementById('trailerStart').value = draftData.trailerStart || '';
                document.getElementById('trailerEnd').value = draftData.trailerEnd || '';
            }
        }
        
        if (draftData.isKmVisible) {
            showOptionalBlock('kmBlock', 'addKmBtn');
            document.getElementById('km').value = draftData.km || '0';
        }
        
        if (draftData.isCommentVisible) {
            showOptionalBlock('commentBlock', 'addCommentBtn');
            document.getElementById('comment').value = draftData.comment || '';
        }

    } catch (e) {
        console.error("Ошибка загрузки черновика:", e);
        localStorage.removeItem(DRAFT_KEY);
    } finally {
        _IS_LOADING_DRAFT = false; // Снимаем флаг в любом случае
    }
}
 
