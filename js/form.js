/**
 * @file form.js
 * @description Логика формы, валидация, предпросмотр и надежная отправка.
 */

const REQUIRED_FIELDS = ['date', 'project', 'techSelect', 'address', 'shiftStart', 'shiftEnd'];
let invalidClickCounter = 0;

function isFormValid() {
    return REQUIRED_FIELDS.every(id => document.getElementById(id)?.value);
}

function updateFormValidationState() {
    // ... (эта функция остается без изменений)
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
        tg.MainButton.setParams({ color: tg.themeParams.button_color, text_color: tg.themeParams.button_text_color });
    } else {
        tg.MainButton.setParams({ color: tg.themeParams.secondary_bg_color, text_color: tg.themeParams.hint_color });
    }
}

function triggerInvalidFormAnimation() {
    // ... (эта функция остается без изменений)
    try { tg.HapticFeedback.notificationOccurred('error'); } catch(e) {}
    invalidClickCounter++;
    REQUIRED_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
            const wrapper = el.closest('.form-group');
            wrapper.classList.add('shake');
            setTimeout(() => wrapper.classList.remove('shake'), 500);
            if (invalidClickCounter >= 3) {
                const tooltip = wrapper.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.classList.add('visible');
                    setTimeout(() => tooltip.classList.remove('visible'), 3000);
                }
            }
        }
    });
}

function setupFormValidationListeners() {
    // ... (эта функция остается без изменений)
    const allInputs = document.querySelectorAll('.required-field, input, select, textarea');
    allInputs.forEach(el => {
        el.addEventListener('input', () => {
            invalidClickCounter = 0;
            document.querySelectorAll('.tooltip.visible').forEach(t => t.classList.remove('visible'));
            if(el.classList.contains('required-field')) updateFormValidationState();
            saveDraft();
        });
    });
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
    // ... (эта функция остается без изменений)
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
    if (isFirstRun && !_isInitialized) {
        loadDraft();
        updateFormValidationState();
    }
}

function calcOvertime(startTime, endTime) {
    // ... (эта функция остается без изменений)
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
    // ... (эта функция остается без изменений)
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
    if (_REPORT.reason) items.push(`\n❗️ Причина: ${_REPORT.reason}`);
    document.getElementById('modalPreviewText').innerText = items.filter(Boolean).join('\n');
    document.getElementById('modalPreview').style.display = 'flex';
    resetSendButton();
}

function preparePreview() {
    // ... (эта функция остается без изменений)
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
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('editBtn').disabled = true;
    document.getElementById('sendBtn').innerText = 'Отправка...';

    const action = _REPORT.isEdit ? 'submitEdit' : 'submitReport';

    // Отправляем, ждем ответа, и только потом закрываем
    callApi(action, _REPORT,
        (resp) => {
            if (resp.status === 'ok') {
                const reportData = resp.newReport || resp.updatedReport;
                updateLocalCache(reportData, _REPORT.isEdit);
                saveProjectHistory(_REPORT.project);
                localStorage.removeItem('reportDraft');
                if (_REPORT.isEdit) {
                    cancelEdit(false);
                }
                tg.close();
            } else {
                tg.showAlert(resp.message || 'Произошла ошибка на сервере.');
                resetSendButton();
            }
        },
        (err) => {
            tg.showAlert('Ошибка отправки: ' + (err.message || 'Проверьте интернет-соединение.'));
            resetSendButton();
        }
    );
}

function setupFormEventListeners() {
    // ... (эта функция остается без изменений)
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

