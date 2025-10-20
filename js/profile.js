/**
 * @file profile.js
 * @description Логика профиля, включая регистрацию, с использованием нативных элементов Telegram.
 */

function handleNewUserRegistration(promptMessage) {
    tg.showPopup({
        title: 'Регистрация',
        message: promptMessage || 'Пожалуйста, введите ваше ФИО. Это нужно только один раз, чтобы подписывать ваши отчеты.',
        buttons: [{ id: 'save', type: 'default', text: 'Сохранить' }],
        inputs: [{ placeholder: 'Иванов Иван Иванович' }]
    }, (buttonId, inputs) => {
        if (buttonId === 'save') {
            let driverName = inputs[0]?.trim();
            if (driverName) {
                const userInfo = { driverName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD };

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
                            tg.showAlert('Произошла критическая ошибка регистрации: ' + (err.message || err.toString()), () => tg.close());
                        }
                    }
                );
            } else {
                tg.showAlert('Имя обязательно для отчетов. Пожалуйста, перезагрузите форму и введите имя.', () => tg.close());
            }
        } else {
             tg.showAlert('Регистрация обязательна для продолжения.', () => tg.close());
        }
    });
}


function handleSaveName(newName) {
    const oldName = localStorage.getItem('driverName') || '';
    if (!newName) {
        return tg.showAlert('Имя не может быть пустым!');
    }
    if (newName === oldName) return;

    const payload = {
        oldName: oldName, newName: newName,
        accessMethod: _ACCESS_METHOD, tgId: _TG_ID, tgUsername: _TG_USERNAME
    };

    const successCallback = (resp) => {
        if (resp && (resp.status === 'ok' || resp.status === 'no_change')) {
            localStorage.setItem('driverName', newName);
            document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
            if (resp.status === 'ok') tg.showAlert(`Имя успешно обновлено!`);
        } else {
            tg.showAlert('Ошибка при обновлении имени: ' + (resp.message || resp.error || 'Неизвестная ошибка'));
        }
    };

    const errorCallback = (err) => {
        if (err && err.error === 'name_taken') {
            tg.showAlert(err.message || 'Это ФИО уже используется. Пожалуйста, введите другое.');
        } else {
            tg.showAlert('Ошибка сервера при обновлении имени: ' + (err.message || err.toString()));
        }
    };

    callApi('updateDriverName', payload, successCallback, errorCallback);
}

function showProfilePopup() {
    const currentName = localStorage.getItem('driverName') || 'Не указано';
    tg.showPopup({
        title: 'Профиль водителя',
        message: `Текущее ФИО: ${currentName}\n\nВыберите действие:`,
        buttons: [
            { id: 'change_name', type: 'default', text: 'Изменить ФИО' },
            { id: 'edit_last', type: 'default', text: 'Редактировать смену' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId === 'change_name') {
            tg.showPopup({
                title: 'Изменить ФИО',
                message: 'Введите новое ФИО. Оно будет обновлено во всех ваших прошлых отчетах.',
                buttons: [ { id: 'save', type: 'default', text: 'Сохранить' }, { type: 'cancel' } ],
                inputs: [{ placeholder: 'Новое ФИО', value: currentName }]
            }, (btnId, inputs) => {
                if (btnId === 'save') {
                    const newName = inputs[0]?.trim();
                    handleSaveName(newName);
                }
            });
        } else if (buttonId === 'edit_last') {
            loadLastTenReports();
        }
    });
}

function setupProfileEventListeners() {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfilePopup);
    }
}
