/**
 * @file history.js
 * @description Логика для сохранения и загрузки истории проектов в localStorage.
 */
const HISTORY_KEY = 'projectHistory';
const HISTORY_LIMIT = 7;

function loadProjectHistory() {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const datalist = document.getElementById('project-list');
        if (datalist && !document.getElementById('project').value) {
            datalist.innerHTML = '';
            history.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                datalist.appendChild(option);
            });
        }
    } catch (e) {
        console.error('Failed to load project history', e);
    }
}

function saveProjectHistory(project) {
    try {
        const currentProject = project.trim();
        if (!currentProject) return;
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const lowerCaseProject = currentProject.toLowerCase();
        const filteredHistory = history.filter(p => p.toLowerCase() !== lowerCaseProject);
        const newHistory = [currentProject, ...filteredHistory];
        const limitedHistory = newHistory.slice(0, HISTORY_LIMIT);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (e) {
        console.error('Failed to save project history', e);
    }
}
