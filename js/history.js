/**
 * @file history.js
 * @description Логика для сохранения и загрузки истории названий проектов в localStorage.
 */

function loadProjectHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('projectHistory') || '[]');
    const datalist = document.getElementById('project-list');
    if (!document.getElementById('project').value) {
        datalist.innerHTML = ''; 
        history.forEach(project => {
          const option = document.createElement('option');
          option.value = project;
          datalist.appendChild(option);
        });
    }
  } catch (e) {
    console.error('Не удалось загрузить историю проектов', e);
  }
}

function saveProjectHistory(project) {
  try {
    const currentProject = project.trim();
    if (!currentProject) return; 
    const history = JSON.parse(localStorage.getItem('projectHistory') || '[]');
    const lowerCaseProject = currentProject.toLowerCase();
    const filteredHistory = history.filter(p => p.toLowerCase() !== lowerCaseProject); 
    const newHistory = [currentProject, ...filteredHistory];
    const limitedHistory = newHistory.slice(0, 7); // Храним 7 последних проектов
    localStorage.setItem('projectHistory', JSON.stringify(limitedHistory));
  } catch (e) {
    console.error('Не удалось сохранить историю проектов', e);
  }
}

