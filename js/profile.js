/**
 * @file profile.js
 * @description Логика модального окна профиля: смена имени, запуск режима редактирования.
 */

function handleSaveName() {
    const oldName = localStorage.getItem('driverName') || '';
    const newName = document.getElementById('profileNameInput').value.trim();
    if (!newName) {
        alert('Имя не может быть пустым!');
        return;
    }
    if (newName === oldName) {
        document.getElementById('modalProfile').style.display = 'none';
        return;
    }

    const saveBtn = document.getElementById('saveNameBtn');
    const cancelBtn = document.getElementById('cancelNameBtn');
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    saveBtn.innerText = 'Сохранение...';

    const payload = {
        oldName: oldName,
        newName: newName,
        tgId: _TG_ID, 
        tgUsername: _TG_USERNAME
    };

    const successCallback = (resp) => {
        if (resp && (resp.status === 'ok' || resp.status === 'no_change')) {
            localStorage.setItem('driverName', newName);
            document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
            document.getElementById('modalProfile').style.display = 'none';
            if (resp.status === 'ok') alert(`Имя успешно обновлено!`);
        } else {
            alert('Ошибка при обновлении имени: ' + (resp.message || resp.error || 'Неизвестная ошибка'));
        }
        resetSaveButton();
    };

    const errorCallback = (err) => {
        if (err && err.error === 'name_taken') {
            alert(err.message || 'Это ФИО уже используется. Пожалуйста, введите другое.');
        } else {
            alert('Ошибка сервера при обновлении имени: ' + (err.message || err.toString()));
        }
        resetSaveButton();
    };
    
    callApi('updateDriverName', payload, successCallback, errorCallback);
}

function setupProfileEventListeners() {
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
        document.getElementById('modalProfile').style.display = 'flex';
    });
    document.getElementById('cancelNameBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'none';
        resetSaveButton();
    });
    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);
}

