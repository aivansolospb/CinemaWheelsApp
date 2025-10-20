/**
 * @file profile.js
 * @description Логика модального окна профиля, включая регистрацию нового пользователя.
 */

/**
 * НОВАЯ ФУНКЦИЯ: Обрабатывает регистрацию нового пользователя.
 * @param {string} [promptMessage] - Сообщение для prompt-диалога.
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
                loadDraft(); // Важно загрузить черновик после установки имени
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
        alert('Имя не может быть пустым!');
        return;
    }
    if (newName === oldName) {
        document.getElementById('modalProfile').style.display = 'none';
        return;
    }

    resetSaveButton(true); // Блокируем кнопки

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
        resetSaveButton(false); // Разблокируем кнопки
    };

    const errorCallback = (err) => {
        if (err && err.error === 'name_taken') {
            alert(err.message || 'Это ФИО уже используется. Пожалуйста, введите другое.');
        } else {
            alert('Ошибка сервера при обновлении имени: ' + (err.message || err.toString()));
        }
        resetSaveButton(false); // Разблокируем кнопки
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
    });

    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);
}

