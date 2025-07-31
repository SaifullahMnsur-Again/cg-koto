// --- Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadStateFromStorage();
    setupEventListeners();
});

// --- Event Listeners Setup ---
function setupEventListeners() {
    const app = document.getElementById('app');

    // Handles all button clicks and link actions via event delegation
    app.addEventListener('click', e => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        e.preventDefault();

        const action = target.dataset.action;
        const id = target.closest('[id]')?.id;

        const actions = {
            'add-year': addYear,
            'add-semester': () => addSemester(id),
            'add-course': () => addCourse(id),
            'delete-year': () => deleteItem(id),
            'delete-semester': () => deleteItem(id),
            'delete-course': () => deleteItem(id),
            'move-year-up': () => moveItem(id, 'up'),
            'move-year-down': () => moveItem(id, 'down'),
            'move-semester-up': () => moveItem(id, 'up'),
            'move-semester-down': () => moveItem(id, 'down'),
            'move-course-up': () => moveItem(id, 'up'),
            'move-course-down': () => moveItem(id, 'down'),
            'open-preset-modal': () => openPresetModal(id),
            'save-json': saveAsJSON,
            'export-pdf': exportAsPDF,
            'export-text': exportAsText,
            'clear-all': clearAllData,
            'clear-saved': clearSavedData,
        };
        if (actions[action]) {
            actions[action]();
        }
    });

    // Handles all data inputs and updates the state
    app.addEventListener('input', e => {
        const { target } = e;
        const value = target.value;
        
        const key = target.dataset.key; // For user info
        const field = target.dataset.field; // For courses, semesters, years
        
        if (key) { // User info field
            updateStateFromInput(null, key, value, 'userInfo');
            return; // No redraw needed
        }

        const id = target.closest('[id]')?.id;
        if (!field || !id) return;
        
        const courseRow = target.closest('.course-row');
        const semesterEl = target.closest('.semester-table');
        const yearEl = target.closest('.year-section');

        let type = '';
        if(courseRow) type = 'course';
        else if(semesterEl) type = 'semester';
        else if(yearEl) type = 'year';

        // FIX: The core logic change is here
        if (field === 'credits' || field === 'grade') {
            // Update the state with the new value
            updateStateFromInput(id, field, value, type);
            // Recalculate all scores
            recalculateScores();
            // Render ONLY the calculated values, not the whole UI
            renderCalculatedValues();
        } else {
            // For names, codes, titles etc., just update the state silently
            updateStateFromInput(id, field, value, type);
        }
        
        if (target.matches('select[data-field="grade"]')) {
            updateGradePreview(target);
        }
    });

    // Handles loading data from a JSON file
    document.getElementById('fileInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => loadStateFromFile(event.target.result);
        reader.readAsText(file);
        e.target.value = '';
    });

    window.addEventListener('resize', adjustLayout);
}