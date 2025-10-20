/**
 * @file profile.js
 * @description Логика профиля с использованием HTML модальных окон.
 */

function handleNewUserRegistration() {
    showProfileModal({ isRegistration: true });
}

function handleSaveName() {
    const oldName = localStorage.getItem('driverName') || '';
    const newName = document.getElementById('profileNameInput').value.trim();
    const isRegistration = !oldName;

    if (!newName) {
        return tg.showAlert('Имя не может быть пустым!');
    }
    
    const saveBtn = document.getElementById('saveNameBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Сохранение...';

    if (!isRegistration && newName === oldName) {
        hideProfileModal();
        return;
    }

    const payload = isRegistration 
        ? { driverName: newName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD }
        : { oldName: oldName, newName: newName, accessMethod: _ACCESS_METHOD, tgId: _TG_ID, tgUsername: _TG_USERNAME };

    const action = isRegistration ? 'notifyOfNewUser' : 'updateDriverName';

    callApi(action, payload,
        (resp) => { // Успех
            localStorage.setItem('driverName', newName);
            document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
            hideProfileModal();
            if (isRegistration) {
                loadProjectHistory();
                loadDraft();
            } else {
                 tg.showAlert(`Имя успешно обновлено!`);
            }
        },
        (err) => { // Ошибка
            if (err && err.error === 'name_taken') {
                tg.showAlert(err.message || 'Это ФИО уже занято. Пожалуйста, введите другое.');
            } else {
                tg.showAlert(`Произошла ошибка: ${err.message || err.toString()}`, () => {
                    if (isRegistration) tg.close();
                });
            }
            saveBtn.disabled = false;
            saveBtn.innerText = 'Сохранить';
        }
    );
}


function setupProfileEventListeners() {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => showProfileModal({ isRegistration: false }));
    }

    const cancelNameBtn = document.getElementById('cancelNameBtn');
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', () => {
            if (!localStorage.getItem('driverName')) {
                tg.showAlert('Регистрация обязательна для продолжения.', () => tg.close());
            } else {
                hideProfileModal();
            }
        });
    }

    const saveNameBtn = document.getElementById('saveNameBtn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', handleSaveName);
    }
    
    const changeNameMenuBtn = document.getElementById('changeNameMenuBtn');
    if(changeNameMenuBtn) {
        changeNameMenuBtn.addEventListener('click', () => showProfileChangeNameUI());
    }

    const loadEditsBtn = document.getElementById('loadEditsBtn');
    if(loadEditsBtn) {
        loadEditsBtn.addEventListener('click', () => {
            hideProfileModal();
            loadLastTenReports();
        });
    }
}
