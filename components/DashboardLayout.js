import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { initChatbot } from './Chatbot.js';

// Import all possible view render functions
import { renderDashboard } from '../features/dashboard/Dashboard.js';
import { renderStudentManagement } from '../features/students/StudentManagement.js';
import { renderFacultyManagement } from '../features/faculty/FacultyManagement.js';
import { renderAcademicManagement } from '../features/academics/AcademicManagement.js';
import { renderSyllabusUploads } from '../features/academics/SyllabusUploads.js';
import { renderUploadMarks } from '../features/academics/UploadMarks.js';
import { renderEnterStudentMarks } from '../features/academics/EnterStudentMarks.js';
import { renderFinalMarks } from '../features/reports/FinalMarks.js';
import { renderAttendance } from '../features/students/Attendance.js';
import { renderResults } from '../features/students/Results.js';
import { renderAssignments } from '../features/students/Assignments.js';
import { renderDocumentAI } from '../features/hod/DocumentAI.js';
import { renderUploadResults } from '../features/academics/UploadResults.js';
import { renderUploadAssignmentMarks } from '../features/academics/UploadAssignmentMarks.js';
import { renderUploadLabMarks } from '../features/academics/UploadLabMarks.js';
import { renderEvents } from '../features/events/Events.js';
import { renderViewSyllabus } from '../features/students/ViewSyllabus.js';
import { renderViewMarksheets } from '../features/faculty/ViewMarksheets.js';



const componentMap = {
    Dashboard: renderDashboard,
    StudentManagement: renderStudentManagement,
    FacultyManagement: renderFacultyManagement,
    AcademicManagement: renderAcademicManagement,
    SyllabusUploads: renderSyllabusUploads,
    UploadMarks: renderUploadMarks,
    EnterStudentMarks: renderEnterStudentMarks,
    FinalMarks: renderFinalMarks,
    Attendance: renderAttendance,
    Results: renderResults,
    Assignments: renderAssignments,
    DocumentAI: renderDocumentAI,
    UploadResults: renderUploadResults,
    UploadAssignmentMarks: renderUploadAssignmentMarks,
    UploadLabMarks: renderUploadLabMarks,
    Events: renderEvents,
    ViewSyllabus: renderViewSyllabus,
    ViewMarksheets: renderViewMarksheets,
    Default: renderDashboard,
};


export function renderDashboardLayout(rootElement, props) {
    const { activeComponent, setActiveComponent } = props;
    
    // Map action handlers to the 'on' prefixed props expected by child components.
    const componentProps = {
        ...props,
        onAddStudent: props.addStudent,
        onRemoveStudents: props.removeStudents,
        onAddFaculty: props.addFaculty,
        onRemoveFaculty: props.removeFaculty,
        onUpdateFaculty: props.updateFaculty,
        onAddCourse: props.addCourse,
        onRemoveCourse: props.removeCourse,
        onSaveAllMarks: props.saveAllMarks,
        onUpdateCourseFaculty: props.updateCourseFaculty,
        onUpdateMarks: props.updateMarks,
        onAddEvent: props.addEvent,
        onRemoveEvents: props.removeEvents,
        onUploadSyllabus: props.uploadSyllabus,
        onRemoveSyllabus: props.removeSyllabus,
        onSaveFinalResults: props.saveFinalResults,
        onSaveInternalMarks: props.saveInternalMarks,
        onSaveAssignmentMarks: props.saveAssignmentMarks,
        onSaveLabMarks: props.saveLabMarks,
        onUploadMarksheetPdf: props.uploadMarksheetPdf,
        onRemoveMarksheetPdf: props.removeMarksheetPdf,
        finalResultsStatus: props.finalResultsStatus,
        uploadedMarksheets: props.uploadedMarksheets,
        uploadedAssignmentMarksheets: props.uploadedAssignmentMarksheets,
        uploadedLabMarksheets: props.uploadedLabMarksheets,
        uploadedFinalMarksheets: props.uploadedFinalMarksheets,
    };

    const content = `
        <div class="flex h-screen bg-gray-100">
            <div id="sidebar-container"></div>
            <div class="flex-1 flex flex-col overflow-hidden">
                <div id="header-container"></div>
                <main id="main-content" class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div class="flex items-center justify-center h-full text-lg font-semibold">Loading...</div>
                </main>
            </div>
        </div>
    `;

    rootElement.innerHTML = content;
    
    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer = document.getElementById('header-container');
    const mainContent = document.getElementById('main-content');

    function renderMainContent() {
        mainContent.innerHTML = `<div class="flex items-center justify-center h-full text-lg font-semibold">Loading...</div>`;
        const renderFn = componentMap[activeComponent] || componentMap['Default'];
        // Update the active component in the sidebar rendering
        Sidebar(sidebarContainer, { userRole: props.user.role, activeComponent, setActiveComponent });
        renderFn(mainContent, componentProps);
    }
    
    Header(headerContainer, { user: props.user, onLogout: props.logout });
    
    renderMainContent();

    // Initialize chatbot, it will append itself to the body
    initChatbot();
}