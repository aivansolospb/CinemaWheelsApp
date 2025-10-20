/**
 * @file profile.js
 * @description Логика модального окна профиля, включая регистрацию нового пользователя.
 */

function handleNewUserRegistration(promptMessage) {
    let driverName = prompt(promptMessage || 'Пожалуйста, введите ваше ФИО (это нужно только один раз):', '');

    if (driverName && driverName.trim()) {
        driverName = driverName.trim();
        const userInfo = { driverName: driverName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD };

        callApi('notifyOfNewUser', userInfo,
            (resp) => { // Успех
                localStorage.setItem('driverName', driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
                loadProjectHistory();
                loadDraft();
            },
            (err) => { // Ошибка
                if (err && err.error === 'name_taken') {
                    handleNewUserRegistration(err.message || 'Это ФИО уже занято. Пожалуйста, введите другое.');
                } else {
                    console.error('Не удалось отправить уведомление о регистрации:', err);
                    alert('Произошла критическая ошибка регистрации: ' + (err.message || err.toString()));
                    tg.close();
                }
            }
        );
    } else {
        alert('Имя обязательно для отчетов. Пожалуйста, перезагрузите форму и введите имя.');
        tg.close();
    }
}

function handleSaveName() {
    const oldName = localStorage.getItem('driverName') || '';
    const newName = document.getElementById('profileNameInput').value.trim();
    if (!newName) {
        return alert('Имя не может быть пустым!');
    }
    if (newName === oldName) {
        return document.getElementById('modalProfile').style.display = 'none';
    }

    resetSaveButton(true);

    const payload = {
        oldName: oldName, newName: newName,
        accessMethod: _ACCESS_METHOD, tgId: _TG_ID, tgUsername: _TG_USERNAME
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
        resetSaveButton(false);
    };

    const errorCallback = (err) => {
        if (err && err.error === 'name_taken') {
            alert(err.message || 'Это ФИО уже используется. Пожалуйста, введите другое.');
        } else {
            alert('Ошибка сервера при обновлении имени: ' + (err.message || err.toString()));
        }
        resetSaveButton(false);
    };

    callApi('updateDriverName', payload, successCallback, errorCallback);
}

function setupProfileEventListeners() {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
            document.getElementById('modalProfile').style.display = 'flex';
        });
    }

    const cancelNameBtn = document.getElementById('cancelNameBtn');
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', () => {
            document.getElementById('modalProfile').style.display = 'none';
        });
    }

    const saveNameBtn = document.getElementById('saveNameBtn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', handleSaveName);
    }
}

