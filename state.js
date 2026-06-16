import { MOCK_STUDENTS, MOCK_FACULTY, MOCK_COURSES, MOCK_EVENTS } from './constants.js';
import { UserRole } from './types.js';

const STATE_KEY = 'collegeAppState';

function getInitialState() {
    return {
        // Session state, should be null/default on initial load.
        user: null, 
        activeComponent: 'Dashboard',

        // --- Persisted data ---
        students: MOCK_STUDENTS,
        faculty: MOCK_FACULTY,
        courses: MOCK_COURSES,
        events: MOCK_EVENTS,
        uploadedSyllabi: {},
        uploadedMarksheets: {},
        uploadedAssignmentMarksheets: {},
        uploadedLabMarksheets: {},
        uploadedFinalMarksheets: {},
        finalResultsStatus: { saved: false },
    };
}

export function loadState() {
    try {
        const serializedState = localStorage.getItem(STATE_KEY);
        if (serializedState === null) {
            console.log("No state found in localStorage, initializing with default state.");
            const initialState = getInitialState();
            // Save the initial state so it persists on next load
            saveState(initialState);
            return initialState;
        }
        const loadedState = JSON.parse(serializedState);
        
        // **FIX**: Check if the HOD user exists in the loaded data. If not, reset faculty to default.
        // This prevents login errors if the user has outdated data in localStorage.
        const hodExists = loadedState.faculty && loadedState.faculty.some(f => f.role === UserRole.HOD);
        if (!hodExists) {
            console.warn("HOD user not found in localStorage state. Resetting faculty list to default.");
            loadedState.faculty = MOCK_FACULTY;
        }

        // Ensure session-specific state is reset on load
        loadedState.user = null; 
        loadedState.activeComponent = 'Dashboard';
        
        // Ensure new state properties exist for backward compatibility
        if (!loadedState.uploadedSyllabi) loadedState.uploadedSyllabi = {};
        if (!loadedState.uploadedMarksheets) loadedState.uploadedMarksheets = {};
        if (!loadedState.uploadedAssignmentMarksheets) loadedState.uploadedAssignmentMarksheets = {};
        if (!loadedState.uploadedLabMarksheets) loadedState.uploadedLabMarksheets = {};
        if (!loadedState.uploadedFinalMarksheets) loadedState.uploadedFinalMarksheets = {};
        if (!loadedState.finalResultsStatus) loadedState.finalResultsStatus = { saved: false };

        if (loadedState.courses) {
            loadedState.courses.forEach(c => {
                if (c.internalMarksSaved === undefined) c.internalMarksSaved = false;
            });
        }

        // Ensure all students have the correct data structure
        if (loadedState.students) {
            loadedState.students.forEach(s => {
                if (s.finalResults === undefined) s.finalResults = null;
                // Ensure the nested structure for marks exists
                Object.keys(s.subjectMarks || {}).forEach(courseCode => {
                    const marks = s.subjectMarks[courseCode];
                    if (typeof marks === 'object' && marks !== null) {
                         if (marks.assignments === undefined) marks.assignments = {};
                         if (marks.labExperiments === undefined) marks.labExperiments = {};
                    }
                });
            });
        }

        return loadedState;
    } catch (err) {
        console.error("Could not load state from localStorage, using default state. Error: ", err);
        return getInitialState();
    }
}

export function saveState(state) {
    try {
        // We don't want to persist session state, only the data.
        const { user, activeComponent, ...stateToSave } = state;
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(STATE_KEY, serializedState);
    } catch (err) {
        console.error("Could not save state to localStorage. Error: ", err);
    }
}