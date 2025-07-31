// --- Constants and State Object ---
const GRADE_POINTS = { 'A+': 4.0, 'A': 3.75, 'A-': 3.5, 'B+': 3.25, 'B': 3.0, 'B-': 2.75, 'C+': 2.5, 'C': 2.25, 'D': 2.0, 'F': 0.0 };
let ALL_PRESETS = { semesters: [], electivePools: {} };

let state = {
    userInfo: { studentName: '', degree: '', university: '' },
    years: [],
    calculations: { semesterGpaData: [] }
};

// --- Core Data Logic & Auto-Saving ---
const saveStateToLocalStorage = debounce(() => {
    localStorage.setItem('cgKotoData', JSON.stringify({ userInfo: state.userInfo, years: state.years }));
    console.log("State auto-saved.");
}, 800);

function updateStateFromInput(id, field, value, type) {
    if (type === 'userInfo') {
        state.userInfo[field] = value;
    } else if (type === 'year') {
        const year = state.years.find(y => y.id === id);
        if (year) year[field] = value;
    } else if (type === 'semester') {
        const semester = findSemester(id);
        if (semester) semester[field] = value;
    } else if (type === 'course') {
        for (const year of state.years) {
            for (const semester of year.semesters) {
                const course = semester.courses.find(c => c.id === id);
                if (course) {
                    course[field] = value;
                    break;
                }
            }
        }
    }
    saveStateToLocalStorage();
}

// FIX: New function that ONLY does the math without rendering the whole UI
function recalculateScores() {
    let overallCredits = 0, overallPoints = 0, allCourses = [];
    let runningTotalCredits = 0, runningTotalPoints = 0;
    const semesterGpaData = [];

    (state.years || []).forEach(year => {
        let yearCredits = 0, yearPoints = 0, yearCourses = [];
        (year.semesters || []).forEach(semester => {
            let semCredits = 0, semPoints = 0;
            (semester.courses || []).forEach(course => {
                const credits = parseFloat(course.credits) || 0;
                const gradePoint = parseFloat(course.grade);
                if (credits > 0) {
                    allCourses.push(course);
                    yearCourses.push(course);
                    semCredits += credits;
                    if (!isNaN(gradePoint)) semPoints += credits * gradePoint;
                }
            });
            semester.gpa = (semCredits > 0 ? semPoints / semCredits : 0).toFixed(3);
            semester.totalCredits = semCredits;
            semester.gradeDistribution = getGradeDistribution(semester.courses);
            
            if (semCredits > 0) {
                runningTotalCredits += semCredits;
                runningTotalPoints += semPoints;
                const runningCgpa = (runningTotalPoints / runningTotalCredits).toFixed(3);
                
                semesterGpaData.push({ 
                    fullName: `${semester.name} (${year.name})`, 
                    label: [semester.name, year.name],
                    gpa: semester.gpa, 
                    cgpa: runningCgpa, 
                    credits: semCredits 
                });
            }

            yearCredits += semCredits;
            yearPoints += semPoints;
        });
        year.gpa = (yearCredits > 0 ? yearPoints / yearCredits : 0).toFixed(3);
        year.totalCredits = yearCredits;
        year.gradeDistribution = getGradeDistribution(yearCourses);
        overallCredits += yearCredits;
        overallPoints += yearPoints;
    });

    state.calculations = {
        cgpa: (overallCredits > 0 ? overallPoints / overallCredits : 0).toFixed(3),
        totalCredits: overallCredits,
        totalCourses: allCourses.length,
        gradeDistribution: getGradeDistribution(allCourses),
        semesterGpaData: semesterGpaData
    };
    saveStateToLocalStorage();
}

// This function now handles full structural redraws
function updateAllCalculations() {
    recalculateScores();
    renderUI(); // Full redraw
}

// --- Data Initialization & Loading ---
function loadStateFromStorage() {
    const savedData = localStorage.getItem('cgKotoData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            state.userInfo = parsed.userInfo || state.userInfo;
            state.years = parsed.years || [];
            if (!state.years.length) addYear(false);
        } catch (e) { addYear(false); }
    } else {
        addYear(false);
    }
    fetchPresets();
    updateAllCalculations();
}

function loadStateFromFile(fileContent) {
    try {
        const parsed = JSON.parse(fileContent);
        state.userInfo = parsed.userInfo || state.userInfo;
        state.years = parsed.years || [];
        updateAllCalculations();
    } catch (e) {
        alert("Could not load file. It may be corrupted or in an invalid format.");
    }
}

function fetchPresets() {
    fetch('presets.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => { ALL_PRESETS = data; populatePresetModal(); })
        .catch(err => console.error("Could not fetch presets.json:", err));
}

// --- State Modification Functions ---
function addYear(calculate = true) {
    state.years.push({ id: `year-${Date.now()}`, name: `Academic Year ${state.years.length + 1}`, semesters: [] });
    if (calculate) updateAllCalculations();
}

function addSemester(yearId, semesterData = null) {
    const year = state.years.find(y => y.id === yearId);
    if (!year) return;
    const newSemester = {
        id: `semester-${Date.now()}`,
        name: semesterData?.name || `Semester ${year.semesters.length + 1}`,
        courses: semesterData?.courses?.map(c => ({...c, id: `course-${Date.now()}-${Math.random()}`})) || [{ id: `course-${Date.now()}`, code: '', title: '', credits: '', grade: '' }]
    };
    year.semesters.push(newSemester);
    updateAllCalculations();
}

function addCourse(semesterId) {
    const semester = findSemester(semesterId);
    if (semester) {
        semester.courses.push({ id: `course-${Date.now()}`, code: '', title: '', credits: '', grade: '' });
        updateAllCalculations();
    }
}

function deleteItem(id) {
    if (!id) return;
    for (let i = 0; i < state.years.length; i++) {
        if (state.years[i].id === id) {
            state.years.splice(i, 1);
            updateAllCalculations();
            return;
        }
        for (let j = 0; j < state.years[i].semesters.length; j++) {
            if (state.years[i].semesters[j].id === id) {
                state.years[i].semesters.splice(j, 1);
                updateAllCalculations();
                return;
            }
            const courses = state.years[i].semesters[j].courses;
            const courseIndex = courses.findIndex(c => c.id === id);
            if (courseIndex > -1) {
                courses.splice(courseIndex, 1);
                updateAllCalculations();
                return;
            }
        }
    }
}

function moveItem(id, direction) {
    if (!id) return;
    const move = (arr, index, dir) => {
        const newIndex = index + (dir === 'up' ? -1 : 1);
        if (newIndex >= 0 && newIndex < arr.length) {
            [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
        }
    };
    for (const year of state.years) {
        let yearIndex = state.years.findIndex(y => y.id === id);
        if (yearIndex > -1) { move(state.years, yearIndex, direction); break; }
        for (const semester of year.semesters) {
            let semIndex = year.semesters.findIndex(s => s.id === id);
            if (semIndex > -1) { move(year.semesters, semIndex, direction); break; }
            let courseIndex = semester.courses.findIndex(c => c.id === id);
            if (courseIndex > -1) { move(semester.courses, courseIndex, direction); break; }
        }
    }
    updateAllCalculations();
}

function confirmElectiveChoices(preset) {
    const finalCourses = [];
    const selects = document.querySelectorAll('#preElectiveList select');
    let allValid = true;
    preset.courses.forEach(template => {
        if (!template.isElective) {
            finalCourses.push(template);
            return;
        }
        const select = Array.from(selects).find(s => JSON.parse(s.dataset.placeholder).placeholder === template.placeholder);
        if (select?.value) {
            select.classList.remove('border-red-500');
            finalCourses.push(JSON.parse(select.value));
        } else {
            allValid = false;
            if(select) select.classList.add('border-red-500');
        }
    });
    if (allValid && activeYearIdForPreset) {
        addSemester(activeYearIdForPreset, { ...preset, courses: finalCourses });
        closePreElectiveModal(null, true);
    }
}

function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL data on this page? This cannot be undone.')) return;
    state.userInfo = { studentName: '', degree: '', university: '' };
    state.years = [];
    addYear();
}

function clearSavedData() {
    if (!confirm('Are you sure you want to clear SAVED data from this browser? This will reset the app on the next page load.')) return;
    localStorage.removeItem('cgKotoData');
    alert("Saved data has been cleared.");
}

// --- Helper Utilities ---
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function getGradeDistribution(courses) {
    if (!courses?.length) return "N/A";
    const dist = Object.fromEntries(Object.keys(GRADE_POINTS).map(g => [g, 0]));
    courses.forEach(c => {
        const grade = Object.keys(GRADE_POINTS).find(g => GRADE_POINTS[g] == c.grade);
        if (grade) dist[grade]++;
    });
    return Object.entries(dist).filter(([, count]) => count > 0).map(([g, c]) => `${g}:${c}`).join(' ') || "N/A";
}

function getDegreeAcronym() { return state.userInfo.degree?.match(/[A-Z]{2,}/)?.[0] || 'XXX'; }
function findSemester(id) { return state.years.flatMap(y => y.semesters).find(s => s.id === id); }