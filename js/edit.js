/**
 * @file edit.js
 * @description Логика для режима редактирования с HTML модальным окном.
 */

function loadLastTenReports() {
    const modal = document.getElementById('modalEditList');
    const listEl = document.getElementById('editListContainer');
    listEl.innerHTML = '<div class="loading-text">Загрузка...</div>';
    modal.style.display = 'flex';
    
    callApi('getLastTenReports', { tgId: _TG_ID }, showEditList, (err) => {
        listEl.innerHTML = `<div class="loading-text" style="color: var(--danger-color)">Ошибка загрузки: ${err.message || err.toString()}</div>`;
    });
}

function showEditList(data) {
    const reports = data.reports;
    const listEl = document.getElementById('editListContainer');
    listEl.innerHTML = '';
    
    if (!reports || reports.length === 0) {
        listEl.innerHTML = '<div class="loading-text">Нет доступных отчетов для редактирования.</div>';
        return;
    }

    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    reports.forEach(report => {
        const btn = document.createElement('button');
        btn.className = 'edit-report-item';
        
        let displayDate = '??.??';
        try {
            const parts = report.date.split('-');
            displayDate = `${parts[2]} ${monthNames[parseInt(parts[1], 10) - 1]}`;
        } catch (e) { /* Используем ?? по умолчанию */ }
        
        btn.innerText = `[${displayDate}] ${report.project} (${report.tech})`;
        btn.onclick = () => selectReportForEdit(report);
        listEl.appendChild(btn);
    });
}

function selectReportForEdit(report) {
    _EDIT_MODE_DATA = { ...report };
    
    document.getElementById('date').value = report.date; 
    document.getElementById('project').value = report.project;
    document.getElementById('techSelect').value = report.tech;
    document.getElementById('address').value = report.address;
    document.getElementById('shiftStart').value = report.shiftStart;
    document.getElementById('shiftEnd').value = report.shiftEnd;

    resetAndFillOptionalBlocks(report);
    
    document.getElementById('modalEditList').style.display = 'none';
    tg.MainButton.setText('Показать превью (Редакт.)');
    updateFormValidationState(); // Обновляем состояние кнопки
    
    const cancelContainer = document.getElementById('cancelEditBtnContainer');
    if (!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'toggle-btn-danger';
        cancelBtn.innerText = 'Отменить редактирование';
        cancelBtn.onclick = () => cancelEdit(true);
        cancelContainer.appendChild(cancelBtn);
    }
    
    window.scrollTo(0, 0);
}

function cancelEdit(showAlert = true) {
    if (!_EDIT_MODE_DATA) return;
    _EDIT_MODE_DATA = null;
    document.getElementById('reportForm').reset();
    resetOptionalBlocksVisibility();
    document.getElementById('date').valueAsDate = new Date();
    loadDraft(); // Пытаемся загрузить черновик
    tg.MainButton.setText('Показать превью');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
    updateFormValidationState(); // Обновляем состояние кнопки
    if (showAlert) tg.showAlert('Редактирование отменено.');
}

function hasChanges() {
    if (!_EDIT_MODE_DATA) return true;
    const old = _EDIT_MODE_DATA;
    const form = document.getElementById('reportForm');
    const currentData = {
        date: form.date.value, project: form.project.value, tech: form.techSelect.value,
        address: form.address.value, shiftStart: form.shiftStart.value, shiftEnd: form.shiftEnd.value,
        trailer: document.getElementById('trailerBlock').style.display === 'block' ? form.trailerSelect.value : 'Нет прицепа',
        trailerStart: document.getElementById('trailerTimeInputs').style.display === 'block' ? form.trailerStart.value : '',
        trailerEnd: document.getElementById('trailerTimeInputs').style.display === 'block' ? form.trailerEnd.value : '',
        km: document.getElementById('kmBlock').style.display === 'block' ? (form.km.value || '0') : '0',
        comment: document.getElementById('commentBlock').style.display === 'block' ? form.comment.value : ''
    };
    return Object.keys(currentData).some(key => {
        const oldValue = (key === 'trailer' && old[key] === null) ? 'Нет прицепа' : (old[key] || '');
        const newValue = currentData[key] || '';
        return String(oldValue) !== String(newValue);
    });
}
