/**
 * @file edit.js
 * @description Логика для режима редактирования с использованием нативных элементов Telegram.
 */

function loadLastTenReports() {
    callApi('getLastTenReports', { tgId: _TG_ID }, showEditList, (err) => {
        tg.showAlert('Ошибка загрузки отчетов: ' + (err.message || err.toString()));
    });
}

function showEditList(data) {
    const reports = data.reports;
    
    if (!reports || reports.length === 0) {
        tg.showAlert('Нет доступных отчетов для редактирования.');
        return;
    }

    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    // Используем нативный popup для выбора отчета, так как это удобно
    const popupButtons = reports.map(report => {
        let displayDate = '??.??';
        try {
            const parts = report.date.split('-');
            const day = parts[2];
            const monthIndex = parseInt(parts[1], 10) - 1;
            displayDate = `${day} ${monthNames[monthIndex]}`;
        } catch (e) { /* ignore */ }
        
        return {
            id: report.rowNumber, // Используем уникальный ID строки как ID кнопки
            type: 'default',
            text: `[${displayDate}] ${report.project} (${report.tech})`
        };
    });

    popupButtons.push({ type: 'cancel' });

    tg.showPopup({
        title: 'Выберите отчёт',
        message: 'Какой из последних 10 отчетов вы хотите отредактировать?',
        buttons: popupButtons
    }, (buttonId) => {
        if (buttonId && buttonId !== 'cancel') {
            const selectedReport = reports.find(r => String(r.rowNumber) === String(buttonId));
            if (selectedReport) {
                selectReportForEdit(selectedReport);
            }
        }
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
    
    tg.MainButton.setText('Показать превью (Редакт.)');
    
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
    
    loadDraft(); 
    
    tg.MainButton.setText('Показать превью');
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
    
    if (showAlert) tg.showAlert('Редактирование отменено.');
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
