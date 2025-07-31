// --- UI Globals ---
let gpaChart = null;
let activeYearIdForPreset = null;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
const BLANK_GRADE_OPTION_HTML = `<option value="" selected disabled>Select</option>`;

// --- Main Render Functions ---
function renderUI() {
    renderUserInfo();
    renderYears();
    renderCalculatedValues(); // Initial full render
}

// FIX: New function to only update calculated values without redrawing inputs
function renderCalculatedValues() {
    renderOverallStats();
    renderYearAndSemesterStats();
    renderGpaTrendChart();
    updateMoveButtonStates();
    adjustLayout();
}

// --- Component Renderers ---
function renderUserInfo() {
    for (const key in state.userInfo) {
        const input = document.querySelector(`#userInfo input[data-key="${key}"]`);
        if (input) input.value = state.userInfo[key];
    }
}

function renderOverallStats() {
    const { cgpa, totalCredits, totalCourses, gradeDistribution } = state.calculations;
    document.getElementById('cgpaDisplay').textContent = cgpa || '0.000';
    document.getElementById('totalCreditsDisplay').textContent = totalCredits || '0';
    document.getElementById('totalCoursesDisplay').textContent = totalCourses || '0';
    document.getElementById('overallGradeDist').textContent = gradeDistribution || 'N/A';
}

function renderYearAndSemesterStats() {
    state.years.forEach(year => {
        const yearEl = document.getElementById(year.id);
        if (yearEl) {
            yearEl.querySelector('.year-gpa').textContent = year.gpa;
            yearEl.querySelector('.year-credits').textContent = year.totalCredits;
            yearEl.querySelector('.year-grade-dist').textContent = year.gradeDistribution;
        }
        year.semesters.forEach(semester => {
            const semesterEl = document.getElementById(semester.id);
            if (semesterEl) {
                semesterEl.querySelector('.semester-gpa').textContent = semester.gpa;
                semesterEl.querySelector('.semester-credits').textContent = semester.totalCredits;
                semesterEl.querySelector('.semester-grade-dist').textContent = semester.gradeDistribution;
            }
        });
    });
}

function renderYears() {
    const container = document.getElementById('yearsContainer');
    container.innerHTML = '';
    state.years.forEach(year => container.appendChild(createYearElement(year)));
}

// --- Element Creators ---
function createYearElement(year) {
    const el = document.createElement('div');
    el.className = 'year-section card p-4 sm:p-6 rounded-lg shadow-md group border-main';
    el.id = year.id;
    el.innerHTML = `
        <div class="flex flex-wrap justify-between items-start mb-4 gap-x-4">
            <input type="text" data-field="name" value="${year.name}" placeholder="Academic Year Name" class="text-2xl font-bold w-full md:w-auto flex-grow border-b-2 border-transparent focus:border-blue-500 outline-none transition bg-transparent text-main">
            <div class="flex items-center gap-4 flex-shrink-0 mt-2 md:mt-0">
                <div class="text-right">
                    <div class="year-gpa text-2xl font-bold text-blue-600 dark:text-blue-400">${year.gpa || '0.000'}</div>
                    <div class="text-xs text-subtle uppercase">YGPA</div>
                    <div class="text-xs text-subtle"><span class="year-credits">${year.totalCredits || 0}</span> Cr | <span class="year-grade-dist font-mono">${year.gradeDistribution || 'N/A'}</span></div>
                </div>
                <div class="flex gap-2">
                    <button type="button" data-action="move-year-up" class="move-btn text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg></button>
                    <button type="button" data-action="move-year-down" class="move-btn text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
                    <button type="button" data-action="delete-year" class="delete-btn text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>
        </div>
        <div class="semesters-container space-y-6"></div>
        <div class="mt-4 flex flex-wrap gap-2">
             <button type="button" data-action="add-semester" class="bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/80 text-green-800 dark:text-green-300 font-semibold py-1 px-3 rounded-md transition text-xs">+ Add Semester</button>
             <button type="button" data-action="open-preset-modal" class="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-300 font-semibold py-1 px-3 rounded-md transition text-xs">+ Load Preset</button>
        </div>
    `;
    const semestersContainer = el.querySelector('.semesters-container');
    year.semesters.forEach(sem => semestersContainer.appendChild(createSemesterElement(sem)));
    return el;
}

function createSemesterElement(semester) {
    const el = document.createElement('div');
    el.className = 'semester-table border border-main p-4 rounded-lg group';
    el.id = semester.id;
    el.innerHTML = `
        <div class="flex flex-wrap justify-between items-center mb-3 gap-x-4">
            <input type="text" data-field="name" value="${semester.name}" placeholder="Semester Name" class="text-lg font-semibold w-full md:w-auto flex-grow border-b-2 border-transparent focus:border-blue-500 outline-none transition bg-transparent text-main">
            <div class="flex items-center gap-4 flex-shrink-0 mt-2 md:mt-0">
                <div class="text-right">
                    <div class="semester-gpa text-lg font-bold text-green-600 dark:text-green-400">${semester.gpa || '0.000'}</div>
                    <div class="text-xs text-subtle"><span class="semester-credits">${semester.totalCredits || 0}</span> Cr | <span class="semester-grade-dist font-mono">${semester.gradeDistribution || 'N/A'}</span></div>
                </div>
                <div class="flex gap-2">
                    <button type="button" data-action="move-semester-up" class="move-btn text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg></button>
                    <button type="button" data-action="move-semester-down" class="move-btn text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
                    <button type="button" data-action="delete-semester" class="delete-btn text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            </div>
        </div>
        <div class="overflow-x-auto"><table class="min-w-full"><thead class="table-header"><tr><th class="px-4 py-2 text-left text-xs font-medium text-subtle uppercase tracking-wider w-[20%]">Code</th><th class="px-4 py-2 text-left text-xs font-medium text-subtle uppercase tracking-wider w-[45%]">Course Title</th><th class="px-4 py-2 text-left text-xs font-medium text-subtle uppercase tracking-wider">Credits</th><th class="px-4 py-2 text-left text-xs font-medium text-subtle uppercase tracking-wider">Grade</th><th class="px-4 py-2"></th></tr></thead><tbody class="bg-transparent"></tbody></table></div>
        <button type="button" data-action="add-course" class="mt-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 text-blue-800 dark:text-blue-300 font-semibold py-1 px-3 rounded-md transition text-xs">+ Add Course</button>
    `;
    const tableBody = el.querySelector('tbody');
    semester.courses.forEach(course => tableBody.appendChild(createCourseElement(course)));
    return el;
}

function createCourseElement(course) {
    const el = document.createElement('tr');
    el.className = 'course-row group';
    el.id = course.id;
    const gradeOptions = Object.entries(GRADE_POINTS).map(([g, p]) => `<option value="${p}" ${course.grade == p ? 'selected' : ''}>${g}</option>`).join('');
    el.innerHTML = `
        <td data-label="Code" class="px-4 py-1"><input data-field="code" type="text" value="${course.code || ''}" placeholder="${getDegreeAcronym()}" class="w-full p-1 border-0 focus:ring-0 outline-none transition bg-transparent"></td>
        <td data-label="Title" class="px-4 py-1"><input data-field="title" type="text" value="${course.title || ''}" placeholder="Course Title" class="w-full p-1 border-0 focus:ring-0 outline-none transition bg-transparent"></td>
        <td data-label="Credits" class="px-4 py-1"><input data-field="credits" type="number" value="${course.credits || ''}" placeholder="3.0" min="0" step="0.5" class="w-20 p-1 border-0 focus:ring-0 outline-none transition bg-transparent"></td>
        <td data-label="Grade" class="px-4 py-1 relative"><select data-field="grade" class="w-24 p-1 border-0 focus:ring-0 outline-none transition bg-transparent select-field">${BLANK_GRADE_OPTION_HTML}${gradeOptions}</select><span class="grade-preview"></span></td>
        <td class="px-4 py-1 text-right"><div class="flex gap-2 justify-end">
            <button type="button" data-action="move-course-up" class="move-btn text-gray-400 hover:text-blue-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg></button>
            <button type="button" data-action="move-course-down" class="move-btn text-gray-400 hover:text-blue-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
            <button type="button" data-action="delete-course" class="delete-btn text-gray-400 hover:text-red-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div></td>
    `;
    return el;
}

// --- Chart Rendering ---
function renderGpaTrendChart() {
    const container = document.getElementById('gpaTrendChartContainer');
    const ctx = document.getElementById('gpaTrendChart').getContext('2d');
    const { semesterGpaData } = state.calculations;
    const isDark = document.documentElement.classList.contains('dark');
    
    if (gpaChart) gpaChart.destroy();
    if (!semesterGpaData?.length) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    gpaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: semesterGpaData.map(d => d.label),
            datasets: [
                {
                    label: 'Semester GPA',
                    data: semesterGpaData.map(d => d.gpa),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                },
                {
                    label: 'Cumulative GPA (CGPA)',
                    data: semesterGpaData.map(d => d.cgpa),
                    borderColor: 'rgba(22, 163, 74, 1)',
                    fill: false,
                    tension: 0.2,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(22, 163, 74, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    min: 0,
                    max: 4.0, 
                    grid: { color: isDark ? '#374151' : '#e5e7eb' }, 
                    ticks: { color: isDark ? '#9ca3af' : '#4b5563', font: { size: 12 } } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: isDark ? '#9ca3af' : '#4b5563', font: { size: 12 } } 
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { 
                        color: isDark ? '#9ca3af' : '#4b5563',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1f2937' : '#fff',
                    titleColor: isDark ? '#f9fafb' : '#1f2937',
                    bodyColor: isDark ? '#d1d5db' : '#4b5563',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        title: (items) => semesterGpaData[items[0].dataIndex].fullName,
                    }
                }
            }
        }
    });
    adjustLayout();
}

// --- Modal Logic ---
function openPresetModal(yearId) {
    activeYearIdForPreset = yearId;
    document.getElementById('presetModal').classList.replace('hidden', 'flex');
}
function closePresetModal(event, force = false) {
    const modal = document.getElementById('presetModal');
    if (force || (event && event.target === modal)) {
        modal.classList.replace('flex', 'hidden');
        if (!force) activeYearIdForPreset = null;
    }
}
function populatePresetModal() {
    const listEl = document.getElementById('presetList');
    if (listEl) {
        listEl.innerHTML = ALL_PRESETS.semesters.map(p => `<div class="preset-item p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onclick="selectPreset('${p.id}')"><h4 class="font-semibold text-main">${p.name}</h4><p class="text-sm text-subtle">${p.courses.length} courses</p></div>`).join('');
    }
}
function filterPresets() {
    const filter = document.getElementById('presetSearch').value.toUpperCase();
    document.querySelectorAll('#presetList .preset-item').forEach(item => {
        item.style.display = item.textContent.toUpperCase().includes(filter) ? "" : "none";
    });
}
function selectPreset(presetId) {
    const preset = ALL_PRESETS.semesters.find(p => p.id === presetId);
    if (!preset) return;
    if (preset.courses.some(c => c.isElective)) openPreElectiveModal(preset);
    else addSemester(activeYearIdForPreset, preset);
    closePresetModal(null, true);
}
function openPreElectiveModal(preset) {
    const listEl = document.getElementById('preElectiveList');
    listEl.innerHTML = '';
    preset.courses.filter(c => c.isElective).forEach(slot => {
        const pool = ALL_PRESETS.electivePools[slot.electivePool];
        if (!pool) return;
        const options = pool.map(c => `<option value='${JSON.stringify(c)}'>${c.code} - ${c.title}</option>`).join('');
        listEl.insertAdjacentHTML('beforeend', `<div><label class="block text-sm font-medium text-main">${slot.placeholder}</label><select data-placeholder='${JSON.stringify(slot)}' class="select-field mt-1 block w-full p-2 border rounded-md"><option value="" selected>-- Select a course --</option>${options}</select></div>`);
    });
    document.getElementById('confirmElectivesBtn').onclick = () => confirmElectiveChoices(preset);
    document.getElementById('preElectiveModal').classList.replace('hidden', 'flex');
}
function closePreElectiveModal(event, force = false) {
    const modal = document.getElementById('preElectiveModal');
    if (force || (event && event.target === modal)) {
        modal.classList.replace('flex', 'hidden');
        if (!force) activeYearIdForPreset = null;
    }
}

// --- UI Utility Functions ---
function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        toggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    };
    const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
    toggle.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        renderGpaTrendChart();
    });
}

function updateMoveButtonStates() {
    document.querySelectorAll('.year-section').forEach((year, index, years) => {
        year.querySelector('[data-action="move-year-up"]').disabled = (index === 0);
        year.querySelector('[data-action="move-year-down"]').disabled = (index === years.length - 1);
    });
    document.querySelectorAll('.semesters-container').forEach(container => {
        const semesters = container.querySelectorAll('.semester-table');
        semesters.forEach((semester, index) => {
            semester.querySelector('[data-action="move-semester-up"]').disabled = (index === 0);
            semester.querySelector('[data-action="move-semester-down"]').disabled = (index === semesters.length - 1);
        });
    });
    document.querySelectorAll('.semester-table tbody').forEach(tbody => {
        const courses = tbody.querySelectorAll('.course-row');
        courses.forEach((course, index) => {
            course.querySelector('[data-action="move-course-up"]').disabled = (index === 0);
            course.querySelector('[data-action="move-course-down"]').disabled = (index === courses.length - 1);
        });
    });
}

function adjustLayout() {
    const isMobile = window.innerWidth <= 767;
    if (gpaChart && gpaChart.options) {
        const legendFontSize = isMobile ? 10 : 12;
        const tickFontSize = isMobile ? 9 : 12;
        
        gpaChart.options.plugins.legend.labels.font.size = legendFontSize;
        gpaChart.options.scales.x.ticks.font.size = tickFontSize;
        gpaChart.options.scales.y.ticks.font.size = tickFontSize;
        gpaChart.update('none'); // Update without animation
    }
}

function updateGradePreview(selectElement) {
    const courseRow = selectElement.closest('.course-row');
    if (!courseRow || window.innerWidth <= 767) return; 
    const previewEl = courseRow.querySelector('.grade-preview');
    if (!previewEl) return;
    
    const credits = parseFloat(courseRow.querySelector('[data-field="credits"]').value) || 0;
    const gradePoint = parseFloat(selectElement.value);
    
    if (!credits || isNaN(gradePoint)) {
        previewEl.textContent = '';
        return;
    }

    const semesterEl = courseRow.closest('.semester-table');
    const courses = Array.from(semesterEl.querySelectorAll('.course-row'));
    let totalCredits = 0, totalPoints = 0;
    
    courses.forEach(row => {
        const c = parseFloat(row.querySelector('[data-field="credits"]').value) || 0;
        const g = parseFloat(row.querySelector('[data-field="grade"]').value);
        if (c > 0 && !isNaN(g)) {
            totalCredits += c;
            totalPoints += c * g;
        }
    });

    const previewGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(3) : '0.000';
    previewEl.textContent = `Sem. GPA: ${previewGpa}`;
    setTimeout(() => { if(previewEl) previewEl.textContent = ''; }, 2500);
}