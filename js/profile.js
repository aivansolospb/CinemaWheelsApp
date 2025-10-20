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
        tg.close();
    };

    document.getElementById('saveNameBtn').onclick = () => {
        const nameInput = document.getElementById('profileNameInput');
        const driverName = nameInput.value.trim();
        if (!driverName) {
            const wrapper = nameInput.closest('.form-group');
            wrapper.classList.add('shake');
            nameInput.classList.add('invalid-field');
            setTimeout(() => wrapper.classList.remove('shake'), 500);
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
                switchToProfileMenu();
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
        const wrapper = nameInput.closest('.form-group');
        wrapper.classList.add('shake');
        nameInput.classList.add('invalid-field');
        setTimeout(() => wrapper.classList.remove('shake'), 500);
        return;
    }
    if (newName === oldName) return switchToProfileMenu();

    resetSaveButton(true);
    const payload = { oldName, newName, tgId: _TG_ID, tgUsername: _TG_USERNAME };

    callApi('updateDriverName', payload, 
        (resp) => {
            if (resp && resp.status === 'ok') {
                localStorage.setItem('driverName', newName);
                document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
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
    document.getElementById('profileNameInput').classList.remove('invalid-field');
}

function setupProfileEventListeners() {
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'flex';
        document.getElementById('profileMenu').style.display = 'flex';
        document.getElementById('profileChangeName').style.display = 'none';
    });
    
    document.getElementById('profileNameInput').addEventListener('input', (e) => {
        if(e.target.classList.contains('invalid-field')) {
            e.target.classList.remove('invalid-field');
        }
    });

    document.getElementById('closeProfileBtn').addEventListener('click', switchToProfileMenu);
    document.getElementById('changeNameMenuBtn').addEventListener('click', switchToChangeName);

    document.getElementById('loadEditsBtn').addEventListener('click', () => {
        document.getElementById('modalProfile').style.display = 'none';
        loadLastTenReports();
    });
}

