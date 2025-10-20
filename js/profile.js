/**
 * @file profile.js
 * @description Логика профиля и регистрации.
 */

function handleNewUserRegistration() {
    showProfileModal({ isRegistration: true });
}

function handleSaveName() {
    const oldName = localStorage.getItem('driverName') || '';
    const newName = document.getElementById('profileNameInput').value.trim();
    const isRegistration = !oldName;

    if (!newName) return tg.showAlert('Имя не может быть пустым!');
    
    const saveBtn = document.getElementById('saveNameBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Сохранение...';

    if (!isRegistration && newName === oldName) return hideProfileModal();

    const payload = isRegistration 
        ? { driverName: newName, tgId: _TG_ID, username: _TG_USERNAME, accessMethod: _ACCESS_METHOD }
        : { oldName: oldName, newName: newName, accessMethod: _ACCESS_METHOD, tgId: _TG_ID, tgUsername: _TG_USERNAME };
    const action = isRegistration ? 'notifyOfNewUser' : 'updateDriverName';

    callApi(action, payload,
        (resp) => {
            localStorage.setItem('driverName', newName);
            document.getElementById('driverNameDisplay').innerText = `Водитель: ${newName}`;
            hideProfileModal();
            if (!isRegistration) tg.showAlert(`Имя успешно обновлено!`);
        },
        (err) => {
            if (err?.error === 'name_taken') {
                tg.showAlert(err.message || 'Это ФИО уже занято.');
            } else {
                tg.showAlert(`Ошибка: ${err.message || err.toString()}`, () => {
                    if (isRegistration) tg.close();
                });
            }
            saveBtn.disabled = false;
            saveBtn.innerText = 'Сохранить';
        }
    );
}

function clearCacheAndReload() {
    showConfirmModal("Подтверждение", "Вы уверены, что хотите очистить все данные? Это действие приведет к повторной регистрации.", (isOk) => {
        if (isOk) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

function setupProfileEventListeners() {
    document.getElementById('profileBtn').addEventListener('click', () => showProfileModal({ isRegistration: false }));
    document.getElementById('closeProfileBtn').addEventListener('click', hideProfileModal);
    document.getElementById('cancelNameBtn').addEventListener('click', () => {
        if (!localStorage.getItem('driverName')) {
            tg.showAlert('Регистрация обязательна.', () => tg.close());
        } else {
            showProfileMenuUI();
        }
    });
    document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);
    document.getElementById('changeNameMenuBtn').addEventListener('click', () => showProfileChangeNameUI());
    document.getElementById('loadEditsBtn').addEventListener('click', () => {
        hideProfileModal();
        loadLastTenReports();
    });

    const adminPanel = document.getElementById('admin-panel');
    if (SHOW_ADMIN_FEATURES) {
        adminPanel.style.display = 'block';
        document.getElementById('clearCacheBtn').addEventListener('click', clearCacheAndReload);
    } else {
        adminPanel.style.display = 'none';
    }
}

