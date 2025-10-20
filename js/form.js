/**
 * @file form.js
 * @description Логика основной формы: расчеты, подготовка превью, отправка данных.
 */

function validateForm() {
    const form = document.getElementById('reportForm');
    const requiredFields = [
        { id: 'date', name: 'Дата' },
        { id: 'project', name: 'Проект' },
        { id: 'techSelect', name: 'Техника' },
        { id: 'address', name: 'Адрес' },
        { id: 'shiftStart', name: 'Начало смены' },
        { id: 'shiftEnd', name: 'Конец смены' },
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value) {
            tg.showAlert(`Пожалуйста, заполните поле "${field.name}".`);
            return false;
        }
    }
    return true;
}


function handleSubmit() {
    if (tg.MainButton.isVisible && tg.MainButton.isProgressVisible) return;
    
    // ИСПРАВЛЕНО: Добавлена валидация перед отправкой
    if (!validateForm()) {
        return;
    }

    if (_EDIT_MODE_DATA && !hasChanges()) {
        tg.showAlert('Вы не внесли никаких изменений в отчет.');
        return;
    }
    preparePreview();
}

function populateLists(data) {
    const tSel = document.getElementById('techSelect');
    const trSel = document.getElementById('trailerSelect');
    
    if (!tSel || !trSel) return;
    
    const isFirstRun = tSel.options.length <= 1;

    // Сохраняем текущие значения, чтобы не сбросить выбор пользователя при обновлении
    const currentTech = tSel.value;
    const currentTrailer = trSel.value;

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
    
    // Восстанавливаем значения
    tSel.value = currentTech;
    trSel.value = currentTrailer;

    // Загрузка черновика происходит только при первой загрузке списков,
    // чтобы не сбрасывать состояние при фоновом обновлении.
    if (isFirstRun) {
        loadDraft();
    }
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

function showPreviewPopup() {
    let formattedDate;
    try { const p = _REPORT.date.split('-'); formattedDate = `${p[2]}.${p[1]}.${p[0].slice(-2)}`; } 
    catch (e) { formattedDate = _REPORT.date; }

    const overtime = calcOvertime(_REPORT.shiftStart, _REPORT.shiftEnd);
    const trailerOvertime = (_REPORT.trailer !== 'Нет прицепа') ? calcOvertime(_REPORT.trailerStart, _REPORT.trailerEnd) : '0:00';
    
    _REPORT.overtime = overtime;
    _REPORT.trailerOvertime = trailerOvertime;

    const previewItems = [
        `🗓 ${formattedDate}`, `Водитель: ${_REPORT.driverName}`, `Проект: ${_REPORT.project}`,
        `Техника: ${_REPORT.tech || '-'}`, _REPORT.trailer !== 'Нет прицепа' ? `Прицеп: ${_REPORT.trailer}` : `Прицеп: нет`,
        `Адрес: ${_REPORT.address}`, `Смена: ${_REPORT.shiftStart} — ${_REPORT.shiftEnd} (Переработка: ${overtime})`,
        _REPORT.trailer !== 'Нет прицепа' ? `Смена прицепа: ${_REPORT.trailerStart} — ${_REPORT.trailerEnd} (Переработка: ${trailerOvertime})` : '',
        (_REPORT.km > 0) ? `Перепробег: ${_REPORT.km} км` : `Перепробег: 0 км`,
        _REPORT.comment ? `Комментарий: ${_REPORT.comment}` : ''
    ];
    if (_REPORT.reason) previewItems.push(`\n❗️ ПРИЧИНА РЕДАКТИРОВАНИЯ:\n${_REPORT.reason}`);

    const message = previewItems.filter(Boolean).join('\n');
    const buttonText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';

    tg.showPopup({
        title: 'Превью отчёта',
        message: message,
        buttons: [
            {id: 'send', type: 'default', text: buttonText},
            {id: 'edit', type: 'destructive', text: 'Редактировать'}
        ]
    }, (buttonId) => {
        if (buttonId === 'send') {
            sendReport();
        }
    });
}

function preparePreview() {
    const form = document.getElementById('reportForm');
    const isTrailerVisible = document.getElementById('trailerBlock').style.display === 'block';
    const isKmVisible = document.getElementById('kmBlock').style.display === 'block';
    const customTrailerTime = document.getElementById('trailerTimeInputs').style.display === 'block';
    const trailer = isTrailerVisible ? form.trailerSelect.value : '';

    if (isTrailerVisible && !trailer) {
        return tg.showAlert('Вы добавили прицеп, но не выбрали его из списка.');
    }
    const trailerStart = (isTrailerVisible && customTrailerTime) ? form.trailerStart.value : (isTrailerVisible ? form.shiftStart.value : '');
    const trailerEnd = (isTrailerVisible && customTrailerTime) ? form.trailerEnd.value : (isTrailerVisible ? form.shiftEnd.value : '');

    if (isTrailerVisible && customTrailerTime && (!trailerStart || !trailerEnd)) {
        return tg.showAlert('Вы не заполнили время для прицепа.');
    }

    _REPORT = {
        date: form.date.value, driverName: localStorage.getItem('driverName'), tgId: _TG_ID, tgUsername: _TG_USERNAME,
        project: form.project.value, tech: form.techSelect.value, trailer: trailer || 'Нет прицепа', address: form.address.value,
        shiftStart: form.shiftStart.value, shiftEnd: form.shiftEnd.value,
        trailerStart, trailerEnd,
        km: (isKmVisible ? form.km.value : 0) || 0,
        comment: form.comment.value.trim(),
        isEdit: !!_EDIT_MODE_DATA,
        oldRowNumber: _EDIT_MODE_DATA?.rowNumber,
        oldMessageId: _EDIT_MODE_DATA?.messageId,
    };

    if (_EDIT_MODE_DATA) {
        showReasonModal((reason) => {
            if (reason === null) return; 
            if (!reason) {
                tg.showAlert('Причина обязательна для редактирования.');
                preparePreview(); 
                return;
            }
            _REPORT.reason = reason;
            showPreviewPopup();
        });
    } else {
        showPreviewPopup();
    }
}

function sendReport() {
    tg.MainButton.showProgress();
    tg.MainButton.disable();

    const action = _REPORT.isEdit ? 'submitEdit' : 'submitReport';
    const payload = _REPORT.isEdit ? {
        oldRowNumber: _REPORT.oldRowNumber,
        oldMessageId: _REPORT.oldMessageId,
        reason: _REPORT.reason,
        reportData: _REPORT
    } : _REPORT;

    callApi(action, payload, 
        (resp) => { // success
            if (resp && resp.status === 'ok') {
                saveProjectHistory(_REPORT.project);
                localStorage.removeItem('reportDraft');
                if (_REPORT.isEdit) cancelEdit(false);
                tg.close();
            } else {
                tg.showAlert('Ошибка при отправке: ' + JSON.stringify(resp));
                tg.MainButton.hideProgress();
                tg.MainButton.enable();
            }
        },
        (err) => { // error
            tg.showAlert('Ошибка сервера: ' + (err.message || err.toString()));
            tg.MainButton.hideProgress();
            tg.MainButton.enable();
        }
    );
}

function setupFormEventListeners() {
    const addTrailerBtn = document.getElementById('addTrailerBtn');
    if (addTrailerBtn) addTrailerBtn.addEventListener('click', () => { showOptionalBlock('trailerBlock', 'addTrailerBtn'); saveDraft(); });
    
    const addKmBtn = document.getElementById('addKmBtn');
    if (addKmBtn) addKmBtn.addEventListener('click', () => { showOptionalBlock('kmBlock', 'addKmBtn'); saveDraft(); });
    
    const addCommentBtn = document.getElementById('addCommentBtn');
    if (addCommentBtn) addCommentBtn.addEventListener('click', () => { showOptionalBlock('commentBlock', 'addCommentBtn'); saveDraft(); });
    
    const toggleTrailerTimeBtn = document.getElementById('toggleTrailerTimeBtn');
    if (toggleTrailerTimeBtn) {
        toggleTrailerTimeBtn.addEventListener('click', () => { 
          showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
          if (!document.getElementById('trailerStart').value) document.getElementById('trailerStart').value = document.getElementById('shiftStart').value;
          if (!document.getElementById('trailerEnd').value) document.getElementById('trailerEnd').value = document.getElementById('shiftEnd').value;
          saveDraft(); 
        });
    }
}

