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
    
    reports.forEach(report => {
        const btn = document.createElement('button');
        btn.className = 'edit-report-item';
        
        // ИЗМЕНЕНО (Фикс бага "undefined")
        // Берем дату YYYY-MM-DD, отрезаем последние 5 символов (MM-DD) и меняем "-" на "." => DD.MM
        const displayDate = report.date.slice(5).replace('-', '.');
        
        btn.innerText = `[${displayDate}] ${report.project} (${report.tech})`;
        btn.title = `Адрес: ${report.address}\nСмена: ${report.shiftStart}-${report.shiftEnd}`;
        btn.onclick = () => selectReportForEdit(report);
        listEl.appendChild(btn);
    });
}

function selectReportForEdit(report) {
    // Сохраняем весь объект отчета
    _EDIT_MODE_DATA = { ...report };
    
    document.getElementById('date').value = report.date; 
    document.getElementById('project').value = report.project;
    document.getElementById('techSelect').value = report.tech;
    document.getElementById('address').value = report.address;
    document.getElementById('shiftStart').value = report.shiftStart;
    document.getElementById('shiftEnd').value = report.shiftEnd;

    // Сброс опциональных блоков
    document.getElementById('trailerBlock').style.display = 'none';
    document.getElementById('addTrailerBtn').style.display = 'block';
    document.getElementById('trailerTimeInputs').style.display = 'none';
    document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
    document.getElementById('kmBlock').style.display = 'none';
    document.getElementById('addKmBtn').style.display = 'block';
    document.getElementById('commentBlock').style.display = 'none';
    document.getElementById('addCommentBtn').style.display = 'block';

    // Заполнение прицепа
    if (report.trailer && report.trailer !== 'Нет прицепа') {
        showOptionalBlock('trailerBlock', 'addTrailerBtn');
        document.getElementById('trailerSelect').value = report.trailer;
        
        if (report.trailerStart && (report.trailerStart !== report.shiftStart || report.trailerEnd !== report.shiftEnd)) {
            showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn', true);
            document.getElementById('trailerStart').value = report.trailerStart;
            document.getElementById('trailerEnd').value = report.trailerEnd;
        } else {
            document.getElementById('trailerStart').value = '';
            document.getElementById('trailerEnd').value = '';
        }
    } else {
         document.getElementById('trailerSelect').value = '';
    }
    
    // Заполнение км
    if (report.km > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    } else {
        document.getElementById('km').value = '0';
    }
    
    // Заполнение комментария
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    } else {
         document.getElementById('comment').value = '';
    }
    
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
    
    document.getElementById('trailerBlock').style.display = 'none';
    document.getElementById('addTrailerBtn').style.display = 'block';
    document.getElementById('trailerTimeInputs').style.display = 'none';
    document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
    document.getElementById('kmBlock').style.display = 'none';
    document.getElementById('addKmBtn').style.display = 'block';
    document.getElementById('commentBlock').style.display = 'none';
    document.getElementById('addCommentBtn').style.display = 'block';
    
    loadDraft(); 
    
    document.getElementById('submitBtn').innerText = 'Показать превью';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
    
    if (showAlert) alert('Редактирование отменено.');
}

function setupEditEventListeners() {
    document.getElementById('loadEditsBtn').addEventListener('click', loadLastTenReports);
}

