/**
 * @file profile.js
 * @description Логика модального окна профиля, включая регистрацию и сброс.
 */

function handleNewUserRegistration() {
    document.getElementById('profileMenu').style.display = 'none';
    const changeNameView = document.getElementById('profileChangeName');
    changeNameView.style.display = 'flex';
    document.getElementById('profileNameInput').value = '';
    
    const cancelBtn = document.getElementById('cancelNameBtn');
    cancelBtn.onclick = () => {
        tg.showAlert('Регистрация обязательна для использования приложения.');
        tg.close();
    };

    document.getElementById('saveNameBtn').onclick = () => {
        const driverName = document.getElementById('profileNameInput').value.trim();
        if (!driverName) {
            return tg.showAlert('Имя не может быть пустым.');
        }

        const userInfo = { driverName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD };
        resetSaveButton(true);

        callApi('notifyOfNewUser', userInfo,
            (resp) => {
                if (resp && resp.error === 'name_taken') {
                    tg.showAlert(resp.message || 'Это ФИО уже занято.');
                    resetSaveButton(false);
                    return;
                }
                localStorage.setItem('driverName', driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
                loadProjectHistory();
                loadDraft();
                document.getElementById('modalProfile').style.display = 'none';
                resetSaveButton(false);
                switchToProfileMenu(); // Возвращаем обычное поведение кнопкам
            },
            (err) => {
                tg.showAlert('Ошибка регистрации: ' + (err.message || err.toString()));
                resetSaveButton(false);
            }
        );
    };

    document.getElementById('modalProfile').style.display = 'flex';
}


function handleSaveName() {
    const oldName = localStorage.getItem('driverName') || '';
    const newName = document.getElementById('profileNameInput').value.trim();
    if (!newName) return tg.showAlert('Имя не может быть пустым!');
    if (newName === oldName) return switchToProfileMenu();

    resetSaveButton(true);
    const payload = { oldName, newName, tgId: _TG_ID, tgUsername: _TG_USERNAME };

    callApi('updateDriverName', payload, 
        (resp) => {
            if (resp && resp.status === 'ok') {
                localStorage.setItem('driverName', newName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
                tg.showAlert(`Имя успешно обновлено!`);
                switchToProfileMenu();
            } else if (resp && resp.error === 'name_taken') {
                tg.showAlert(resp.message || 'Это ФИО уже занято.');
            } else {
                tg.showAlert('Ошибка: ' + (resp.message || 'Неизвестная ошибка'));
            }
            resetSaveButton(false);
        },
        (err) => {
            tg.showAlert('Ошибка сервера: ' + (err.message || err.toString()));
            resetSaveButton(false);
        }
    );
}

function switchToChangeName() {
    document.getElementById('profileMenu').style.display = 'none';
    const changeNameView = document.getElementById('profileChangeName');
    changeNameView.style.display = 'flex';
    document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
    document.getElementById('saveNameBtn').onclick = handleSaveName;
    document.getElementById('cancelNameBtn').onclick = switchToProfileMenu;
}

function switchToProfileMenu() {
    document.getElementById('profileMenu').style.display = 'flex';
    document.getElementById('profileChangeName').style.display = 'none';
    document.getElementById('modalProfile').style.display = 'none';
}

function setupProfileEventListeners() {
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'flex';
        document.getElementById('profileMenu').style.display = 'flex';
        document.getElementById('profileChangeName').style.display = 'none';
    });

    document.getElementById('closeProfileBtn').addEventListener('click', switchToProfileMenu);
    document.getElementById('changeNameMenuBtn').addEventListener('click', switchToChangeName);

    document.getElementById('loadEditsBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'none';
        loadLastTenReports();
    });
}

