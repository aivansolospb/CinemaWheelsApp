/**
 * @file form.js
 * @description Логика основной формы: расчеты, подготовка превью, отправка данных.
 */

function handleSubmit() {
    if (_EDIT_MODE_DATA && !hasChanges()) {
        const hint = document.getElementById('noChangesHint');
        hint.style.display = 'block';
        setTimeout(() => {
            hint.style.display = 'none';
        }, 2000);
        return;
    }
    preparePreview();
}

function populateLists(data) {
    const tSel = document.getElementById('techSelect');
    const trSel = document.getElementById('trailerSelect');
    
    tSel.innerHTML = '<option value="">— выберите технику —</option>';
    (data.tech || []).forEach(x => { 
        const o = document.createElement('option'); 
        o.value = x; o.text = x; tSel.appendChild(o); 
    });
    
    trSel.innerHTML = '<option value="">— выберите прицеп —</option>';
    (data.trailer || []).forEach(x => { 
        const o = document.createElement('option'); 
        o.value = x; o.text = x; trSel.appendChild(o); 
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
        if (reason === null) return; // Пользователь нажал "Отмена"
        if (reason.trim() === "") {
            alert("Причина обязательна для редактирования.");
            return;
        }
        reason = reason.trim().substring(0, 50);
    }
    
    const form = document.getElementById('reportForm');
    const isTrailerVisible = document.getElementById('trailerBlock').style.display === 'block';
    const isKmVisible = document.getElementById('kmBlock').style.display === 'block';
    const isCommentVisible = document.getElementById('commentBlock').style.display === 'block';
    const customTrailerTime = document.getElementById('trailerTimeInputs').style.display === 'block';
    const trailer = isTrailerVisible ? form.trailerSelect.value : '';
    const trailerStart = (isTrailerVisible && customTrailerTime) ? form.trailerStart.value : (isTrailerVisible ? form.shiftStart.value : '');
    const trailerEnd = (isTrailerVisible && customTrailerTime) ? form.trailerEnd.value : (isTrailerVisible ? form.shiftEnd.value : '');

    if (isTrailerVisible && !trailer) { return alert('Вы добавили прицеп, но не выбрали его из списка.'); }
    if (isTrailerVisible && customTrailerTime && (!trailerStart || !trailerEnd)) { return alert('Вы не заполнили время для прицепа.'); }

    let formattedDate;
    try { const p = form.date.value.split('-'); formattedDate = `${p[2]}.${p[1]}.${p[0].slice(-2)}`; } 
    catch (e) { formattedDate = form.date.value; }

    const overtime = calcOvertime(form.shiftStart.value, form.shiftEnd.value);
    const trailerOvertime = (isTrailerVisible && trailer) ? calcOvertime(trailerStart, trailerEnd) : '0:00';

    const previewItems = [
        `🗓 ${formattedDate}`, `Водитель: ${localStorage.getItem('driverName')}`, `Проект: ${form.project.value}`,
        `Техника: ${form.techSelect.value || '-'}`, trailer ? `Прицеп: ${trailer}` : `Прицеп: нет`,
        `Адрес: ${form.address.value}`, `Смена: ${form.shiftStart.value} — ${form.shiftEnd.value} (Переработка: ${overtime})`,
        trailer ? `Смена прицепа: ${trailerStart} — ${trailerEnd} (Переработка: ${trailerOvertime})` : '',
        (isKmVisible && form.km.value > 0) ? `Перепробег: ${form.km.value} км` : `Перепробег: 0 км`,
        (isCommentVisible && form.comment.value.trim()) ? `Комментарий: ${form.comment.value.trim()}` : ''
    ];
    if (reason) previewItems.push(`\n❗️ ПРИЧИНА РЕДАКТИРОВАНИЯ:\n${reason}`);

    document.getElementById('modalPreviewText').innerText = previewItems.filter(Boolean).join('\n');
    
    _REPORT = {
        date: form.date.value, driverName: localStorage.getItem('driverName'), tgId: _TG_ID, tgUsername: _TG_USERNAME,
        project: form.project.value, tech: form.techSelect.value, trailer: trailer || 'Нет прицепа', address: form.address.value,
        shiftStart: form.shiftStart.value, shiftEnd: form.shiftEnd.value, overtime,
        trailerStart, trailerEnd, trailerOvertime,
        km: (isKmVisible ? form.km.value : 0) || 0,
        comment: (isCommentVisible ? form.comment.value.trim() : ''),
        accessMethod: _ACCESS_METHOD,
        isEdit: !!_EDIT_MODE_DATA,
        reason: reason,
        oldRowNumber: _EDIT_MODE_DATA?.rowNumber,
        oldMessageId: _EDIT_MODE_DATA?.messageId,
    };

    document.getElementById('modalPreview').style.display = 'flex';
    resetSendButton();
}

function sendReport() {
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('editBtn').disabled = true;
    document.getElementById('sendBtn').innerText = 'Отправка...';

    const successCallback = (resp) => {
        if (resp && resp.status === 'ok') {
            saveProjectHistory(_REPORT.project);
            localStorage.removeItem(DRAFT_KEY);
            if (_REPORT.isEdit) cancelEdit(false);
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

    const action = _REPORT.isEdit ? 'submitEdit' : 'submitReport';
    const payload = _REPORT.isEdit ? {
        oldRowNumber: _REPORT.oldRowNumber,
        oldMessageId: _REPORT.oldMessageId,
        reason: _REPORT.reason,
        reportData: _REPORT
    } : _REPORT;
    
    callApi(action, payload, successCallback, errorCallback);
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

