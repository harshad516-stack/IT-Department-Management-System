
import { renderLoginScreen } from './components/LoginScreen.js';
import { renderDashboardLayout } from './components/DashboardLayout.js';
import { UserRole } from './types.js';
import { loadState, saveState } from './state.js';


export default function App(rootElement) {
    // State is loaded from localStorage on startup.
    const state = loadState();

    function render() {
        if (!state.user) {
            renderLoginScreen(rootElement, { onLogin: actions.login });
        } else {
            renderDashboardLayout(rootElement, { ...state, ...actions });
        }
    }

    const actions = {
        login: (role) => {
            // This is mock login logic that finds a default user from the state.
            let userToLogin;
            if (role === UserRole.HOD) {
                userToLogin = state.faculty.find(f => f.role === UserRole.HOD);
            } else if (role === UserRole.Faculty) {
                userToLogin = state.faculty.find(f => f.role === UserRole.Faculty);
            } else if (role === UserRole.Student) {
                // For simplicity, log in as the first student.
                userToLogin = state.students[0];
            }

            if (userToLogin) {
                state.user = { ...userToLogin, role: role };
                state.activeComponent = 'Dashboard';
                render();
            } else {
                alert(`Cannot log in. A default user for the '${role}' role could not be found.`);
            }
        },
        logout: () => {
            state.user = null;
            render();
        },
        setActiveComponent: (componentName) => {
            state.activeComponent = componentName;
            render();
        },
        
        addStudent: (newStudent) => {
            const newId = `S${String(state.students.length + 1).padStart(3, '0')}`;
            state.students.push({
                id: newId,
                ...newStudent,
                attendance: 100, // Default attendance
                subjectMarks: {},
                finalResults: null
            });
            saveState(state);
            alert('Student added successfully!');
            render();
        },
        removeStudents: (studentIds) => {
            state.students = state.students.filter(student => !studentIds.includes(student.id));
            saveState(state);
            alert(`${studentIds.length} student(s) removed successfully!`);
            render();
        },
        updateMarks: (updates) => {
            updates.forEach(({ studentId, courseCode, markType, value }) => {
                const student = state.students.find(s => s.id === studentId);
                if (student) {
                    if (!student.subjectMarks[courseCode]) {
                        student.subjectMarks[courseCode] = {};
                    }
                    if (value === null || isNaN(value)) {
                        delete student.subjectMarks[courseCode][markType];
                    } else {
                        student.subjectMarks[courseCode][markType] = value;
                    }
                }
            });
            saveState(state);
            alert(`${updates.length} mark(s) updated successfully!`);
            render();
        },
        addFaculty: (newFaculty) => {
            const newId = `F${String(state.faculty.length + 1).padStart(3, '0')}`;
            state.faculty.push({ id: newId, ...newFaculty, role: UserRole.Faculty });
            saveState(state);
            alert('Faculty added successfully!');
            render();
        },
        removeFaculty: (facultyIds) => {
            state.faculty = state.faculty.filter(f => !facultyIds.includes(f.id));
            saveState(state);
            alert(`${facultyIds.length} faculty member(s) removed successfully!`);
            render();
        },
        updateFaculty: (facultyId, updatedData) => {
            const index = state.faculty.findIndex(f => f.id === facultyId);
            if (index !== -1) {
                state.faculty[index] = { ...state.faculty[index], ...updatedData };
                saveState(state);
                alert('Faculty details updated successfully!');
                render();
            } else {
                alert('Error: Faculty member not found.');
            }
        },
        addCourse: (newCourse) => {
            state.courses.push({
                ...newCourse,
                faculty: 'Unassigned',
                internalMarksSaved: false
            });
            saveState(state);
            alert('Course added successfully!');
            render();
        },
        removeCourse: (courseCode) => {
            state.courses = state.courses.filter(course => course.code !== courseCode);
            // Also remove associated marks from all students
            state.students.forEach(student => {
                delete student.subjectMarks[courseCode];
            });
            saveState(state);
            alert(`Course ${courseCode} removed successfully!`);
            render();
        },
        updateCourseFaculty: (courseCode, facultyName) => {
            const course = state.courses.find(c => c.code === courseCode);
            if (course) {
                course.faculty = facultyName;
                saveState(state);
                alert(`Faculty for course ${courseCode} updated.`);
                render();
            }
        },
        addEvent: (newEvent) => {
            const newId = `EVT${Date.now()}`;
            state.events.unshift({ id: newId, ...newEvent });
            saveState(state);
            alert('Event added successfully!');
            render();
        },
        removeEvents: (eventIds) => {
            state.events = state.events.filter(event => !eventIds.includes(event.id));
            saveState(state);
            alert(`${eventIds.length} event(s) removed successfully!`);
            render();
        },
        uploadSyllabus: (courseCode, fileURL) => {
            state.uploadedSyllabi[courseCode] = fileURL;
            saveState(state);
            alert(`Syllabus for ${courseCode} uploaded successfully!`);
            render();
        },
        removeSyllabus: (courseCode) => {
            delete state.uploadedSyllabi[courseCode];
            saveState(state);
            alert(`Syllabus for ${courseCode} has been removed.`);
            render();
        },
        uploadMarksheetPdf: (courseCode, marksheetType, fileURL) => {
             const key = marksheetType === 'final' ? 'FINAL_SEMESTER_RESULTS' : courseCode;
             const stateObject = {
                internal: state.uploadedMarksheets,
                assignment: state.uploadedAssignmentMarksheets,
                lab: state.uploadedLabMarksheets,
                final: state.uploadedFinalMarksheets,
            }[marksheetType];
            
            stateObject[key] = fileURL;
            saveState(state);
            alert(`${marksheetType} marksheet uploaded successfully!`);
            render();
        },
        removeMarksheetPdf: (courseCode, marksheetType) => {
            const key = marksheetType === 'final' ? 'FINAL_SEMESTER_RESULTS' : courseCode;
            const stateObject = {
                internal: state.uploadedMarksheets,
                assignment: state.uploadedAssignmentMarksheets,
                lab: state.uploadedLabMarksheets,
                final: state.uploadedFinalMarksheets,
            }[marksheetType];
            delete stateObject[key];
            saveState(state);
            alert(`${marksheetType} marksheet removed successfully!`);
            render();
        },
        saveFinalResults: (resultData) => {
            let updatedCount = 0;
            resultData.students.forEach(resultStudent => {
                const studentInState = state.students.find(s => s.name.toLowerCase() === resultStudent.name.toLowerCase());
                if (studentInState) {
                    studentInState.finalResults = {
                        subjects: resultData.subjects,
                        ...resultStudent
                    };
                    updatedCount++;
                }
            });
            state.finalResultsStatus.saved = true;
            saveState(state);
            alert(`${updatedCount} student final results saved successfully!`);
            render();
        },
        saveInternalMarks: (courseCode, updates, pdfDataUrl) => {
            state.uploadedMarksheets[courseCode] = pdfDataUrl;
            updates.forEach(({ studentId, markType, value }) => {
                const student = state.students.find(s => s.id === studentId);
                if (student) {
                    if (!student.subjectMarks[courseCode]) student.subjectMarks[courseCode] = {};
                    student.subjectMarks[courseCode][markType] = value;
                }
            });
            const course = state.courses.find(c => c.code === courseCode);
            if (course) course.internalMarksSaved = true;

            saveState(state);
            alert(`Internal marks for ${courseCode} saved successfully!`);
            render();
        },
        saveAssignmentMarks: (courseCode, updates, pdfDataUrl) => {
            state.uploadedAssignmentMarksheets[courseCode] = pdfDataUrl;
            updates.forEach(({ studentId, markType, value }) => {
                const student = state.students.find(s => s.id === studentId);
                if (student) {
                    if (!student.subjectMarks[courseCode]) student.subjectMarks[courseCode] = {};
                    if (!student.subjectMarks[courseCode].assignments) student.subjectMarks[courseCode].assignments = {};
                    student.subjectMarks[courseCode].assignments[markType] = value;
                }
            });
            saveState(state);
            alert(`Assignment marks for ${courseCode} saved successfully!`);
            render();
        },
        saveLabMarks: (courseCode, updates, pdfDataUrl) => {
            state.uploadedLabMarksheets[courseCode] = pdfDataUrl;
            updates.forEach(({ studentId, markType, value }) => {
                const student = state.students.find(s => s.id === studentId);
                if (student) {
                    if (!student.subjectMarks[courseCode]) student.subjectMarks[courseCode] = {};
                    if (!student.subjectMarks[courseCode].labExperiments) student.subjectMarks[courseCode].labExperiments = {};
                    student.subjectMarks[courseCode].labExperiments[markType] = value;
                }
            });
            saveState(state);
            alert(`Lab marks for ${courseCode} saved successfully!`);
            render();
        },
    };

    // Initial render of the application
    render();
}
