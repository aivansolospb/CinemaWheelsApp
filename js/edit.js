/**
 * @file edit.js
 * @description Логика для режима редактирования прошлых отчетов.
 */

function loadLastTenReports() {
    document.getElementById('modalProfile').style.display = 'none';
    
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
            const day = parts[2];
            const monthIndex = parseInt(parts[1], 10) - 1;
            displayDate = `${day}.${monthNames[monthIndex]}`;
        } catch (e) { /* Используем ?? по умолчанию */ }
        
        btn.innerText = `[${displayDate}] ${report.project} (${report.tech})`;
        btn.title = `Адрес: ${report.address}\nСмена: ${report.shiftStart}-${report.shiftEnd}`;
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
    document.getElementById('submitBtn').innerText = 'Показать превью (Редактирование)';
    
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
    if (!_EDIT_MODE_DATA) {
        if (!showAlert) return;
    }
      
    _EDIT_MODE_DATA = null;
    document.getElementById('reportForm').reset();
    
    resetOptionalBlocksVisibility();
    
    loadDraft(); 
    
    document.getElementById('submitBtn').innerText = 'Показать превью';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
    
    if (showAlert) alert('Редактирование отменено.');
}

function hasChanges() {
    if (!_EDIT_MODE_DATA) return true;

    const old = _EDIT_MODE_DATA;
    const form = document.getElementById('reportForm');
    
    const currentData = {
        date: form.date.value,
        project: form.project.value,
        tech: form.techSelect.value,
        address: form.address.value,
        shiftStart: form.shiftStart.value,
        shiftEnd: form.shiftEnd.value,
        trailer: document.getElementById('trailerBlock').style.display === 'block' ? form.trailerSelect.value : 'Нет прицепа',
        trailerStart: document.getElementById('trailerTimeInputs').style.display === 'block' ? form.trailerStart.value : '',
        trailerEnd: document.getElementById('trailerTimeInputs').style.display === 'block' ? form.trailerEnd.value : '',
        km: document.getElementById('kmBlock').style.display === 'block' ? (form.km.value || '0') : '0',
        comment: document.getElementById('commentBlock').style.display === 'block' ? form.comment.value : ''
    };
    
    if (old.date !== currentData.date) return true;
    if (old.project !== currentData.project) return true;
    if (old.tech !== currentData.tech) return true;
    if (old.address !== currentData.address) return true;
    if (old.shiftStart !== currentData.shiftStart) return true;
    if (old.shiftEnd !== currentData.shiftEnd) return true;
    if ((old.trailer || 'Нет прицепа') !== currentData.trailer) return true;
    if ((old.trailerStart || '') !== currentData.trailerStart) return true;
    if ((old.trailerEnd || '') !== currentData.trailerEnd) return true;
    if (String(old.km || '0') !== currentData.km) return true;
    if ((old.comment || '') !== currentData.comment) return true;

    return false;
}

function setupEditEventListeners() {
    const loadEditsBtn = document.getElementById('loadEditsBtn');
    if (loadEditsBtn) {
        loadEditsBtn.addEventListener('click', loadLastTenReports);
    }
}

