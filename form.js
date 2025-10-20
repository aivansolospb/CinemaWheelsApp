/**
 * @file form.js
 * @description Логика основной формы: расчеты, подготовка превью, отправка данных.
 */

/**
 * Заполняет выпадающие списки (техника, прицепы) данными с сервера.
 * @param {object} data - Объект со списками { tech: [...], trailer: [...] }.
 */
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
    
    loadDraft(); // Загружаем черновик после того, как списки готовы
}

/**
 * Рассчитывает время переработки.
 * @param {string} startTime - Время начала в формате "HH:mm".
 * @param {string} endTime - Время окончания в формате "HH:mm".
 * @returns {string} - Время переработки в формате "H:mm".
 */
function calcOvertime(startTime, endTime) {
    if (!startTime || !endTime) return '0:00';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end < start) end += 24 * 60; // Учет перехода через полночь
    const duration = end - start;
    const rawOvertimeMinutes = Math.max(0, duration - 12 * 60); // Более 12 часов
    const overtimeMinutes = Math.round(rawOvertimeMinutes / 15) * 15; // Округление до 15 мин
    const h = Math.floor(overtimeMinutes / 60);
    const m = overtimeMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Готовит данные отчета, формирует текст для превью и показывает модальное окно.
 */
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

    const driverName = localStorage.getItem('driverName') || 'Неизвестно';
    const date = document.getElementById('date').value;
    let formattedDate = date;
    try {
        const parts = date.split('-');
        formattedDate = `${parts[2]}.${parts[1]}.${parts[0].slice(-2)}`;
    } catch (e) {
        formattedDate = date;
    }
    const project = document.getElementById('project').value;
    const tech = document.getElementById('techSelect').value;
    const address = document.getElementById('address').value;
    const shiftStart = document.getElementById('shiftStart').value;
    const shiftEnd = document.getElementById('shiftEnd').value;
    const isTrailerVisible = document.getElementById('trailerBlock').style.display === 'block';
    const isKmVisible = document.getElementById('kmBlock').style.display === 'block';
    const isCommentVisible = document.getElementById('commentBlock').style.display === 'block';
    const comment = isCommentVisible ? document.getElementById('comment').value.trim() : '';
    const trailer = isTrailerVisible ? document.getElementById('trailerSelect').value : '';
    const km = isKmVisible ? (document.getElementById('km').value || 0) : 0;
    const customTrailerTime = document.getElementById('trailerTimeInputs').style.display === 'block';
    const trailerStart = (isTrailerVisible && customTrailerTime) ? document.getElementById('trailerStart').value : (isTrailerVisible ? shiftStart : '');
    const trailerEnd = (isTrailerVisible && customTrailerTime) ? document.getElementById('trailerEnd').value : (isTrailerVisible ? shiftEnd : '');

    if (isTrailerVisible && !trailer) { alert('Вы добавили блок "Прицеп", но не выбрали прицеп из списка.'); return; }
    if (isTrailerVisible && customTrailerTime && (!trailerStart || !trailerEnd)) { alert('Вы указали, что время прицепа отличается, но не заполнили поля "Начало / Конец" для него.'); return; }

    const overtime = calcOvertime(shiftStart, shiftEnd);
    const trailerOvertime = (isTrailerVisible && trailer) ? calcOvertime(trailerStart, trailerEnd) : '0:00';

    let previewItems = [
        `🗓 ${formattedDate}`, `Водитель: ${driverName}`, `Проект: ${project}`,
        `Техника: ${tech || '-'}`, trailer ? `Прицеп: ${trailer}` : `Прицеп: нет`,
        `Адрес: ${address}`, `Смена: ${shiftStart} — ${shiftEnd} (Переработка: ${overtime})`,
        trailer ? `Смена прицепа: ${trailerStart} — ${trailerEnd} (Переработка: ${trailerOvertime})` : '',
        (km > 0) ? `Перепробег: ${km} км` : `Перепробег: 0 км`,
        (comment) ? `Комментарий: ${comment}` : ''
    ];

    if (_EDIT_MODE_DATA) {
        previewItems.push(`\n❗️ ПРИЧИНА РЕДАКТИРОВАНИЯ:\n${reason}`);
    }

    document.getElementById('modalPreviewText').innerText = previewItems.filter(Boolean).join('\n');

    _REPORT = {
        date: date, driverName, tgId: _TG_ID, tgUsername: _TG_USERNAME, project, tech,
        trailer: trailer || 'Нет прицепа', address,
        shiftStart, shiftEnd, overtime,
        trailerStart: trailerStart || '', trailerEnd: trailerEnd || '', trailerOvertime,
        km, comment: comment || '',
        accessMethod: _ACCESS_METHOD
    };
    
    if (_EDIT_MODE_DATA) {
        _REPORT.isEdit = true;
        _REPORT.reason = reason;
        _REPORT.oldRowNumber = _EDIT_MODE_DATA.rowNumber;
        _REPORT.oldMessageId = _EDIT_MODE_DATA.messageId;
    } else {
        _REPORT.isEdit = false;
    }

    document.getElementById('modalPreview').style.display = 'flex';
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('editBtn').disabled = false;
    document.getElementById('sendBtn').innerText = _EDIT_MODE_DATA ? 'Отправить (Редакт.)' : 'Отправить отчет';
}

/**
 * Отправляет данные отчета на сервер.
 */
function sendReport() {
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


/**
 * Устанавливает слушатели событий для элементов формы.
 */
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
