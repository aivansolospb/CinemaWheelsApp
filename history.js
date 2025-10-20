/**
 * @file history.js
 * @description Управление историей названий проектов в localStorage для автодополнения.
 */

/**
 * Загружает историю проектов из localStorage и заполняет datalist.
 */
function loadProjectHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('projectHistory') || '[]');
        const datalist = document.getElementById('project-list');
        // Заполняем только если поле проекта пустое, чтобы не мешать вводу
        if (!document.getElementById('project').value) {
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

/**
 * Сохраняет название проекта в историю в localStorage.
 * @param {string} project - Название проекта для сохранения.
 */
function saveProjectHistory(project) {
    try {
        const currentProject = project.trim();
        if (!currentProject) return; 
        
        // Загружаем существующую историю
        const history = JSON.parse(localStorage.getItem('projectHistory') || '[]');
        const lowerCaseProject = currentProject.toLowerCase();
        
        // Удаляем дубликаты (без учета регистра)
        const filteredHistory = history.filter(p => p.toLowerCase() !== lowerCaseProject); 
        
        // Добавляем новый проект в начало
        const newHistory = [currentProject, ...filteredHistory];
        
        // Ограничиваем историю 7-ю последними записями
        const limitedHistory = newHistory.slice(0, 7);
        
        localStorage.setItem('projectHistory', JSON.stringify(limitedHistory));
    } catch (e) { 
        console.error('Failed to save project history', e); 
    }
}
