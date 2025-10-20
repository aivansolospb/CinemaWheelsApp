/**
 * @file profile.js
 * @description Логика модального окна профиля, включая смену имени.
 */

/**
 * Обрабатывает сохранение нового имени водителя.
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
        accessMethod: _ACCESS_METHOD,
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


/**
 * Устанавливает слушатели событий для модального окна профиля.
 */
function setupProfileEventListeners() {
    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);
}
