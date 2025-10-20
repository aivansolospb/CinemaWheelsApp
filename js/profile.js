/**
 * @file profile.js
 * @description Логика модального окна профиля, включая регистрацию и сброс.
 */

function handleNewUserRegistration() {
    showProfileView('profileChangeName');
    document.getElementById('profileNameInput').value = '';
    
    document.getElementById('cancelNameBtn').onclick = () => {
        tg.close();
    };

    document.getElementById('saveNameBtn').onclick = () => {
        const nameInput = document.getElementById('profileNameInput');
        const driverName = nameInput.value.trim();
        if (!driverName) {
            triggerInvalidInputAnimation(nameInput);
            return;
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
                resetSaveButton(false);
                hideProfileModal();
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
    const nameInput = document.getElementById('profileNameInput');
    const newName = nameInput.value.trim();

    if (!newName) {
        triggerInvalidInputAnimation(nameInput);
        return;
    }
    if (newName === oldName) return hideProfileModal();

    resetSaveButton(true);
    const payload = { oldName, newName, tgId: _TG_ID, tgUsername: _TG_USERNAME };

    callApi('updateDriverName', payload, 
        (resp) => {
            if (resp && resp.status === 'ok') {
                localStorage.setItem('driverName', newName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
                hideProfileModal();
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
        document.getElementById('profileNameInput').value = localStorage.getItem('driverName') || '';
    });
    
    document.getElementById('cancelNameBtn').addEventListener('click', () => {
        // During registration, this button has a different behavior set dynamically
        // Default behavior is to go back to the main menu
        if (localStorage.getItem('driverName')) {
             showProfileView('profileMenu');
        } else {
            // This case should ideally not be hit if registration flow is followed
            hideProfileModal();
        }
    });

    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);

    document.getElementById('loadEditsBtn').addEventListener('click', () => {
        hideProfileModal();
        loadLastTenReports();
    });
}

