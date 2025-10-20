/**
 * @file form.js
 * @description Логика основной формы: расчеты, подготовка превью, отправка данных.
 */

/**
 * НОВАЯ ФУНКЦИЯ: Точка входа для отправки формы.
 * Проверяет, есть ли изменения, перед тем как показать превью.
 */
function handleSubmit() {
    // Если мы в режиме редактирования и изменений нет
    if (_EDIT_MODE_DATA && !hasChanges()) {
        const hint = document.getElementById('noChangesHint');
        hint.style.display = 'block';
        // Прячем подсказку через 2 секунды
        setTimeout(() => {
            hint.style.display = 'none';
        }, 2000);
        return; // Прерываем выполнение
    }
    // Если изменения есть или это новый отчет, показываем превью
    preparePreview();
}

function populateLists(data) {
    const tSel = document.getElementById('techSelect');
    const trSel = document.getElementById('trailerSelect');
    
    tSel.innerHTML = '<option value="">— выберите технику —</option>';
    (data && data.tech || []).forEach(x => { 
        const o = document.createElement('option'); 
        o.value = x; 
        o.text = x; 
        tSel.appendChild(o); 
    });
    
    trSel.innerHTML = '<option value="">— выберите прицеп —</option>';
    (data && data.trailer || []).forEach(x => { 
        const o = document.createElement('option'); 
        o.value = x; 
        o.text = x; 
        trSel.appendChild(o); 
    });
    
    loadDraft();
}

function calcOvertime(startTime, endTime) {
    if (!startTime || !endTime) return '0:00';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end < start) end += 24 * 60;
    const duration = end - start;
    const rawOvertimeMinutes = Math.max(0, duration - 12 * 60);
    const overtimeMinutes = Math.round(rawOvertimeMinutes / 15) * 15;
    const h = Math.floor(overtimeMinutes / 60);
    const m = overtimeMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

function preparePreview() {
    let reason = null;
    if (_EDIT_MODE_DATA) {
        reason = prompt("Укажите причину редактирования (max 50 символов):", "");
        if (!reason || reason.trim() === "") {
            alert("Причина обязательна для редактирования. Отмена.");
            return;
        }
        reason = reason.trim().substring(0, 50);
    }

    const reportData = getFormData();
    
    if (reportData.isTrailerVisible && !reportData.trailer) {
        alert('Вы добавили блок "Прицеп", но не выбрали прицеп из списка.');
        return;
    }
    if (reportData.isTrailerVisible && reportData.customTrailerTime && (!reportData.trailerStart || !reportData.trailerEnd)) {
        alert('Вы указали, что время прицепа отличается, но не заполнили поля "Начало / Конец" для него.');
        return;
    }

    const previewText = generatePreviewText(reportData, reason);
    document.getElementById('modalPreviewText').innerText = previewText;
    
    _REPORT = createReportObject(reportData, reason);

    document.getElementById('modalPreview').style.display = 'flex';
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('editBtn').disabled = false;
    document.getElementById('sendBtn').innerText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';
}

function sendReport() {
    // УДАЛЕНО: Старая проверка на изменения. Теперь она в handleSubmit.

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('editBtn').disabled = true;
    document.getElementById('sendBtn').innerText = 'Отправка...';

    const successCallback = (resp) => {
        if (resp && resp.status === 'ok') {
            saveProjectHistory(_REPORT.project);
            localStorage.removeItem(DRAFT_KEY);
            cancelEdit(false);
            tg.close();
        } else {
            alert('Ошибка при отправке: ' + JSON.stringify(resp));
            resetSendButton();
        }
    };

    const errorCallback = (err) => {
        alert('Ошибка сервера: ' + (err.message || err.toString()));
        resetSendButton();
    };

    if (_REPORT.isEdit) {
        const payload = {
            oldRowNumber: _REPORT.oldRowNumber,
            oldMessageId: _REPORT.oldMessageId,
            reason: _REPORT.reason,
            reportData: _REPORT
        };
        callApi('submitEdit', payload, successCallback, errorCallback);
    } else {
        callApi('submitReport', _REPORT, successCallback, errorCallback);
    }
}

function setupFormEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendReport);

    document.getElementById('addTrailerBtn').addEventListener('click', () => { showOptionalBlock('trailerBlock', 'addTrailerBtn'); saveDraft(); });
    document.getElementById('addKmBtn').addEventListener('click', () => { showOptionalBlock('kmBlock', 'addKmBtn'); saveDraft(); });
    document.getElementById('addCommentBtn').addEventListener('click', () => { showOptionalBlock('commentBlock', 'addCommentBtn'); saveDraft(); });
    
    document.getElementById('toggleTrailerTimeBtn').addEventListener('click', () => { 
      showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn', true);
      if (!document.getElementById('trailerStart').value) document.getElementById('trailerStart').value = document.getElementById('shiftStart').value;
      if (!document.getElementById('trailerEnd').value) document.getElementById('trailerEnd').value = document.getElementById('shiftEnd').value;
      saveDraft(); 
    });
}

