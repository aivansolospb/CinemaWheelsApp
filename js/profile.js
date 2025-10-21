/**
 * @file profile.js
 * @description Логика модального окна профиля, регистрация и смена ФИО по TG ID.
 */

let _isSyncingName = false;

function handleNewUserRegistration(defaultName = '') {
    showProfileView('profileChangeName');
    document.getElementById('profileNameInput').value = defaultName;
    document.querySelector('#profileChangeName h3').innerText = 'Регистрация';
    
    document.getElementById('cancelNameBtn').onclick = () => tg.close();

    document.getElementById('saveNameBtn').onclick = () => {
        const nameInput = document.getElementById('profileNameInput');
        const driverName = nameInput.value.trim();
        if (!driverName) {
            triggerInvalidInputAnimation(nameInput);
            return;
        }

        const saveBtn = document.getElementById('saveNameBtn');
        saveBtn.disabled = true;
        saveBtn.innerText = 'Проверка...';

        callApi('notifyOfNewUser', { driverName, tgId: _TG_ID, username: _TG_USERNAME },
            (resp) => {
                if (resp && resp.error === 'name_taken') {
                    tg.showAlert(resp.message || 'Это ФИО уже занято.');
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'Сохранить';
                    return;
                }
                localStorage.setItem('driverName', driverName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${driverName}`;
                hideProfileModal();
                initializeApp(); // Запускаем основную логику после успешной регистрации
            },
            (err) => {
                tg.showAlert('Ошибка регистрации: ' + (err.message || err.toString()));
                saveBtn.disabled = false;
                saveBtn.innerText = 'Сохранить';
            }
        );
    };

    document.getElementById('modalProfile').style.display = 'flex';
}

function handleSaveName() {
    if (_isSyncingName) return;

    const nameInput = document.getElementById('profileNameInput');
    const newName = nameInput.value.trim();
    const oldName = localStorage.getItem('driverName') || '';

    if (!newName) {
        triggerInvalidInputAnimation(nameInput);
        return;
    }
    if (newName === oldName) {
        hideProfileModal();
        return;
    }

    _isSyncingName = true;
    const saveBtn = document.getElementById('saveNameBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Сохранение...';

    callApi('syncDriverNameByTgId', { newName, tgId: _TG_ID, tgUsername: _TG_USERNAME, oldName },
        (resp) => {
            if (resp && resp.error === 'name_taken') {
                tg.showAlert(resp.message || 'Это ФИО уже занято.');
            } else if (resp.status === 'ok') {
                localStorage.setItem('driverName', newName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
                hideProfileModal();
            } else {
                 tg.showAlert('Неизвестная ошибка при смене имени.');
            }
        },
        (err) => {
            tg.showAlert('Ошибка сервера: ' + (err.message || 'Попробуйте позже.'));
        }
    ).finally(() => {
        _isSyncingName = false;
        saveBtn.disabled = false;
        saveBtn.innerText = 'Сохранить';
    });
}

function triggerInvalidInputAnimation(inputElement) {
    try { tg.HapticFeedback.notificationOccurred('error'); } catch(e) {}
    const wrapper = inputElement.closest('.form-group');
    if (wrapper) {
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 500);
    }
    inputElement.classList.add('invalid-field');
}


function showProfileView(viewId) {
    document.getElementById('profileMenu').style.display = 'none';
    document.getElementById('profileChangeName').style.display = 'none';
    document.getElementById(viewId).style.display = 'flex';
}

function hideProfileModal() {
    document.getElementById('modalProfile').style.display = 'none';
    document.getElementById('profileNameInput').classList.remove('invalid-field');
}

function setupProfileEventListeners() {
    document.getElementById('profileBtn').addEventListener('click', () => {
        showProfileView('profileMenu');
        document.getElementById('modalProfile').style.display = 'flex';
    });
    
    document.getElementById('profileNameInput').addEventListener('input', (e) => {
        if(e.target.classList.contains('invalid-field')) {
            e.target.classList.remove('invalid-field');
        }
    });

    document.getElementById('closeProfileBtn').addEventListener('click', hideProfileModal);
    
    document.getElementById('changeNameMenuBtn').addEventListener('click', () => {
        showProfileView('profileChangeName');
        document.querySelector('#profileChangeName h3').innerText = 'Изменение ФИО';
        document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
    });
    
    document.getElementById('cancelNameBtn').addEventListener('click', () => {
        if (localStorage.getItem('driverName')) {
             showProfileView('profileMenu');
        } else {
            tg.close();
        }
    });

    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);

    document.getElementById('loadEditsBtn').addEventListener('click', () => {
        hideProfileModal();
        displayReportsFromCache();
    });
}
