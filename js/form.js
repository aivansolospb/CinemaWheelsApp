/**
 * @file form.js
 * @description Логика формы, валидация, превью.
 */

const REQUIRED_FIELDS = ['date', 'project', 'techSelect', 'address', 'shiftStart', 'shiftEnd'];

function isFormValid() {
    return REQUIRED_FIELDS.every(id => document.getElementById(id)?.value);
}

function updateFormValidationState() {
    let isAllValid = true;
    REQUIRED_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.value) {
                el.classList.remove('invalid-field');
            } else {
                el.classList.add('invalid-field');
                isAllValid = false;
            }
        }
    });

    if (isAllValid) {
        tg.MainButton.enable();
        tg.MainButton.setParams({ color: tg.themeParams.button_color });
    } else {
        tg.MainButton.disable();
        tg.MainButton.setParams({ color: tg.themeParams.secondary_bg_color });
    }
}

function triggerInvalidFormAnimation() {
    try {
        tg.HapticFeedback.notificationOccurred('error');
    } catch(e) { console.error("Haptic feedback error", e); }

    REQUIRED_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 500);
        }
    });
}

function setupFormValidationListeners() {
    const allInputs = document.querySelectorAll('.required-field, input, select, textarea');
    allInputs.forEach(el => {
        el.addEventListener('input', () => {
            if(el.classList.contains('required-field')) {
                updateFormValidationState();
            }
            // Сохраняем черновик при любом изменении
            saveDraft();
        });
    });
    // Первичная проверка при загрузке
    updateFormValidationState();
}

function handleSubmit() {
    if (tg.MainButton.isVisible && tg.MainButton.isProgressVisible) return;
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
    const currentTech = tSel.value;
    const currentTrailer = trSel.value;
    tSel.innerHTML = '<option value="">— выберите технику —</option>';
    (data.tech || []).forEach(x => { const o = new Option(x, x); tSel.add(o); });
    trSel.innerHTML = '<option value="">— выберите прицеп —</option>';
    (data.trailer || []).forEach(x => { const o = new Option(x, x); trSel.add(o); });
    tSel.value = currentTech;
    trSel.value = currentTrailer;
    if (isFirstRun) {
        loadDraft();
        updateFormValidationState(); // Проверяем валидность после загрузки черновика
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
    let formattedDate = _REPORT.date;
    try { const p = _REPORT.date.split('-'); formattedDate = `${p[2]}.${p[1]}.${p[0]}`; } catch (e) {}
    _REPORT.overtime = calcOvertime(_REPORT.shiftStart, _REPORT.shiftEnd);
    _REPORT.trailerOvertime = (_REPORT.trailer !== 'Нет прицепа') ? calcOvertime(_REPORT.trailerStart, _REPORT.trailerEnd) : '0:00';

    const items = [
        `🗓 ${formattedDate}`, `👤 Водитель: ${_REPORT.driverName}`, `🛠 Проект: ${_REPORT.project}`,
        `🚚 Техника: ${_REPORT.tech || '-'}`, _REPORT.trailer !== 'Нет прицепа' ? `➕ Прицеп: ${_REPORT.trailer}` : null,
        `📍 Адрес: ${_REPORT.address}`, `🕔 Смена: ${_REPORT.shiftStart} — ${_REPORT.shiftEnd} (Переработка: ${_REPORT.overtime})`,
        _REPORT.trailer !== 'Нет прицепа' ? `🕔 Смена прицепа: ${_REPORT.trailerStart} — ${_REPORT.trailerEnd} (Переработка: ${_REPORT.trailerOvertime})` : null,
        (_REPORT.km > 0) ? `🛣 Перепробег: ${_REPORT.km} км` : null, _REPORT.comment ? `💬 Комментарий: ${_REPORT.comment}` : null
    ];
    if (_REPORT.reason) items.push(`\n❗️ <b>Причина:</b> ${_REPORT.reason}`);
    const message = items.filter(Boolean).join('\n');
    
    tg.showPopup({
        title: 'Превью отчёта', message: message.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        buttons: [ {id: 'send', type: 'default', text: _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет'}, {id: 'edit', type: 'destructive', text: 'Редактировать'} ]
    }, (id) => { if (id === 'send') sendReport(); });
}

function preparePreview() {
    const form = document.getElementById('reportForm');
    const isTrailerVisible = document.getElementById('trailerBlock').style.display === 'block';
    const trailer = isTrailerVisible ? form.trailerSelect.value : '';
    if (isTrailerVisible && !trailer) return tg.showAlert('Вы добавили прицеп, но не выбрали его из списка.');
    const customTrailerTime = document.getElementById('trailerTimeInputs').style.display === 'block';
    const trailerStart = (isTrailerVisible && customTrailerTime) ? form.trailerStart.value : (isTrailerVisible ? form.shiftStart.value : '');
    const trailerEnd = (isTrailerVisible && customTrailerTime) ? form.trailerEnd.value : (isTrailerVisible ? form.shiftEnd.value : '');
    if (isTrailerVisible && customTrailerTime && (!trailerStart || !trailerEnd)) return tg.showAlert('Вы не заполнили время для прицепа.');

    _REPORT = {
        date: form.date.value, driverName: localStorage.getItem('driverName'), tgId: _TG_ID, tgUsername: _TG_USERNAME,
        project: form.project.value, tech: form.techSelect.value, trailer: trailer || 'Нет прицепа', address: form.address.value,
        shiftStart: form.shiftStart.value, shiftEnd: form.shiftEnd.value,
        trailerStart, trailerEnd, km: (document.getElementById('kmBlock').style.display === 'block' ? form.km.value : 0) || 0,
        comment: form.comment.value.trim(), isEdit: !!_EDIT_MODE_DATA,
        oldRowNumber: _EDIT_MODE_DATA?.rowNumber, oldMessageId: _EDIT_MODE_DATA?.messageId,
    };

    if (_EDIT_MODE_DATA) {
        showReasonModal((reason) => {
            if (reason === null) return; 
            if (!reason) { tg.showAlert('Причина обязательна для редактирования.'); preparePreview(); return; }
            _REPORT.reason = reason;
            showPreviewPopup();
        });
    } else { showPreviewPopup(); }
}

function sendReport() {
    tg.MainButton.showProgress().disable();
    const action = _REPORT.isEdit ? 'submitEdit' : 'submitReport';
    const payload = _REPORT.isEdit ? { oldRowNumber: _REPORT.oldRowNumber, oldMessageId: _REPORT.oldMessageId, reason: _REPORT.reason, reportData: _REPORT } : _REPORT;

    callApi(action, payload, 
        (resp) => {
            if (resp && resp.status === 'ok') {
                saveProjectHistory(_REPORT.project);
                localStorage.removeItem('reportDraft');
                if (_REPORT.isEdit) cancelEdit(false);
                tg.close();
            } else {
                tg.showAlert('Ошибка: ' + JSON.stringify(resp));
                tg.MainButton.hideProgress().enable();
            }
        },
        (err) => {
            tg.showAlert('Ошибка сервера: ' + (err.message || err.toString()));
            tg.MainButton.hideProgress().enable();
        }
    );
}

function setupFormEventListeners() {
    document.getElementById('addTrailerBtn').addEventListener('click', () => { showOptionalBlock('trailerBlock', 'addTrailerBtn'); saveDraft(); });
    document.getElementById('addKmBtn').addEventListener('click', () => { showOptionalBlock('kmBlock', 'addKmBtn'); saveDraft(); });
    document.getElementById('addCommentBtn').addEventListener('click', () => { showOptionalBlock('commentBlock', 'addCommentBtn'); saveDraft(); });
    document.getElementById('toggleTrailerTimeBtn').addEventListener('click', () => { 
        showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
        if (!document.getElementById('trailerStart').value) document.getElementById('trailerStart').value = document.getElementById('shiftStart').value;
        if (!document.getElementById('trailerEnd').value) document.getElementById('trailerEnd').value = document.getElementById('shiftEnd').value;
        saveDraft(); 
    });
}

