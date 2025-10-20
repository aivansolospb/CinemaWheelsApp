/**
 * @file ui.js
 * @description Логика для управления элементами интерфейса (опциональные блоки).
 * Вся логика модальных окон была удалена и заменена нативными вызовами Telegram.
 */

function showOptionalBlock(blockId, btnId) {
    const block = document.getElementById(blockId);
    const btn = document.getElementById(btnId);
    if (block) block.style.display = 'block';
    if (btn) btn.style.display = 'none';
}

function hideOptionalBlock(blockId, btnId) {
    const block = document.getElementById(blockId);
    const btn = document.getElementById(btnId);
    if (block) block.style.display = 'none';
    if (btn) btn.style.display = 'block';
    
    const inputs = block.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'number') input.value = '0';
        else if (input.tagName === 'SELECT') input.selectedIndex = 0;
        else input.value = '';
    });

    saveDraft();
}

function resetOptionalBlocksVisibility() {
    hideOptionalBlock('trailerBlock', 'addTrailerBtn');
    hideOptionalBlock('kmBlock', 'addKmBtn');
    hideOptionalBlock('commentBlock', 'addCommentBtn');
    document.getElementById('trailerTimeInputs').style.display = 'none';
    document.getElementById('toggleTrailerTimeBtn').style.display = 'block';
}

function resetAndFillOptionalBlocks(report) {
    resetOptionalBlocksVisibility();

    if (report.trailer && report.trailer !== 'Нет прицепа') {
        showOptionalBlock('trailerBlock', 'addTrailerBtn');
        document.getElementById('trailerSelect').value = report.trailer;
        
        const isCustomTime = report.trailerStart && (report.trailerStart !== report.shiftStart || report.trailerEnd !== report.shiftEnd);
        if (isCustomTime) {
            showOptionalBlock('trailerTimeInputs', 'toggleTrailerTimeBtn');
            document.getElementById('trailerStart').value = report.trailerStart;
            document.getElementById('trailerEnd').value = report.trailerEnd;
        }
    }
    
    if (report.km > 0) {
        showOptionalBlock('kmBlock', 'addKmBtn');
        document.getElementById('km').value = report.km;
    }
    
    if (report.comment) {
        showOptionalBlock('commentBlock', 'addCommentBtn');
        document.getElementById('comment').value = report.comment;
    }
}
