import { UserRole } from './types.js';

// SVG Icons (as functions returning strings)
const DashboardIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
const UsersIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197m0 0A4 4 0 119.646 3.646 4 4 0 0112 4.354z" /></svg>`;
const AcademicCapIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20" /></svg>`;
const BookOpenIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`;
const CalendarIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
const ChartBarIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`;
const UserGroupIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`;
const DocumentUploadIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`;
const DocumentTextIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;


export const NAVIGATION_LINKS = {
    [UserRole.HOD]: [
        { name: 'Dashboard', component: 'Dashboard', icon: DashboardIcon() },
        { name: 'Student Management', component: 'StudentManagement', icon: UsersIcon() },
        { name: 'Faculty Management', component: 'FacultyManagement', icon: UserGroupIcon() },
        { name: 'Academic Management', component: 'AcademicManagement', icon: BookOpenIcon() },
        { name: 'Syllabus Uploads', component: 'SyllabusUploads', icon: DocumentUploadIcon() },
        { name: 'Upload Marks', component: 'UploadMarks', icon: DocumentUploadIcon() },
        { name: 'View Marksheets', component: 'ViewMarksheets', icon: DocumentTextIcon() },
        { name: 'Final Marks', component: 'FinalMarks', icon: ChartBarIcon() },
        { name: 'Events & Notices', component: 'Events', icon: CalendarIcon() },
    ],
    [UserRole.Faculty]: [
        { name: 'Dashboard', component: 'Dashboard', icon: DashboardIcon() },
        { name: 'Faculty Management', component: 'FacultyManagement', icon: UserGroupIcon() },
        { name: 'Student Management', component: 'StudentManagement', icon: UsersIcon() },
        { name: 'Academic Management', component: 'AcademicManagement', icon: BookOpenIcon() },
        { name: 'Syllabus Uploads', component: 'SyllabusUploads', icon: DocumentUploadIcon() },
        { name: 'Upload Marks', component: 'UploadMarks', icon: DocumentUploadIcon() },
        { name: 'View Marksheets', component: 'ViewMarksheets', icon: DocumentTextIcon() },
        { name: 'Enter Student Marks', component: 'EnterStudentMarks', icon: ChartBarIcon() },
        { name: 'Final Marks', component: 'FinalMarks', icon: ChartBarIcon() },
    ],
    [UserRole.Student]: [
        { name: 'Dashboard', component: 'Dashboard', icon: DashboardIcon() },
        { name: 'Timetable', component: 'AcademicManagement', icon: CalendarIcon() },
        { name: 'My Attendance', component: 'Attendance', icon: ChartBarIcon() },
        { name: 'View Syllabus', component: 'ViewSyllabus', icon: DocumentTextIcon() },
        { name: 'Assignments', component: 'Assignments', icon: BookOpenIcon() },
        { name: 'My Results', component: 'Results', icon: AcademicCapIcon() },
    ],
};

// Mock Data
export const MOCK_STUDENTS = [
    { 
        id: 'S001', name: 'Alice Smith', email: 'alice.s@example.com', year: 3, attendance: 91,
        subjectMarks: { 'CS301': { unitTest1: 15, unitTest2: 15, final: 58, assignments: {}, labExperiments: {} }, 'CS201': { unitTest1: 16, unitTest2: 16, final: 60, assignments: {}, labExperiments: {} } },
        subjectAttendance: { 'CS301': { attended: 28, total: 30 }, 'CS201': { attended: 25, total: 28 } },
        finalResults: null
    },
    { 
        id: 'S002', name: 'Bob Johnson', email: 'bob.j@example.com', year: 4, attendance: 88,
        subjectMarks: { 'CS405': { unitTest1: 12, unitTest2: 13, final: 50, assignments: {}, labExperiments: {} }, 'IT401': { unitTest1: 14, unitTest2: 15, final: 52, assignments: {}, labExperiments: {} } },
        subjectAttendance: { 'CS405': { attended: 26, total: 30 }, 'IT401': { attended: 27, total: 30 } },
        finalResults: null
    },
    { 
        id: 'S003', name: 'Charlie Brown', email: 'charlie.b@example.com', year: 2, attendance: 95,
        subjectMarks: { 'CS201': { unitTest1: 18, unitTest2: 17, final: 60, assignments: {}, labExperiments: {} } },
        subjectAttendance: { 'CS201': { attended: 29, total: 30 } },
        finalResults: null
    },
    { 
        id: 'S004', name: 'Diana Prince', email: 'diana.p@example.com', year: 3, attendance: 70,
        subjectMarks: { 'CS301': { unitTest1: 15, unitTest2: 15, final: 50, assignments: {}, labExperiments: {} }, 'CS201': { unitTest1: 14, unitTest2: 16, final: 54, assignments: {}, labExperiments: {} } },
        subjectAttendance: { 'CS301': { attended: 20, total: 30 }, 'CS201': { attended: 22, total: 28 } },
        finalResults: null
    },
    { 
        id: 'S005', name: 'Ethan Hunt', email: 'ethan.h@example.com', year: 4, attendance: 98,
        subjectMarks: { 'CS405': { unitTest1: 18, unitTest2: 18, final: 60, assignments: {}, labExperiments: {} }, 'IT401': { unitTest1: 16, unitTest2: 17, final: 59, assignments: {}, labExperiments: {} } },
        subjectAttendance: { 'CS405': { attended: 29, total: 30 }, 'IT401': { attended: 30, total: 30 } },
        finalResults: null
    },
];

export const MOCK_FACULTY = [
    { id: 'F000', name: 'PROF. Prajkta Khaire', username: 'ssangam', password: 'password', email: 'savita.s@example.com', designation: 'Professor & Head of Dept.', specialization: 'Quantum Computing', researchPapers: 50, role: UserRole.HOD },
    { id: 'F001', name: 'Dr. Alan Turing', username: 'aturing', password: 'password', email: 'alan.t@example.com', designation: 'Professor', specialization: 'AI & ML', researchPapers: 25, role: UserRole.Faculty },
    { id: 'F002', name: 'Dr. Ada Lovelace', username: 'alovelace', password: 'password', email: 'ada.l@example.com', designation: 'Asst. Professor', specialization: 'Data Structures', researchPapers: 12, role: UserRole.Faculty },
    { id: 'F003', name: 'Dr. Grace Hopper', username: 'ghopper', password: 'password', email: 'grace.h@example.com', designation: 'Professor', specialization: 'Compilers', researchPapers: 42, role: UserRole.Faculty },
    { id: 'F004', name: 'Dr. Tim Berners-Lee', username: 'tbl', password: 'password', email: 'tim.bl@example.com', designation: 'Professor', specialization: 'Web Technology', researchPapers: 35, role: UserRole.Faculty },
];

export const MOCK_COURSES = [
    { code: 'CS301', name: 'Advanced Algorithms', credits: 4, faculty: 'Dr. Alan Turing', internalMarksSaved: false },
    { code: 'CS201', name: 'Data Structures', credits: 4, faculty: 'Dr. Ada Lovelace', internalMarksSaved: false },
    { code: 'CS405', name: 'Compiler Design', credits: 3, faculty: 'Dr. Grace Hopper', internalMarksSaved: false },
    { code: 'IT401', name: 'Web Architecture', credits: 3, faculty: 'Dr. Tim Berners-Lee', internalMarksSaved: false },
];

export const MOCK_EVENTS = [
    { id: 'EVT001', title: 'Departmental Hackathon "CodeStorm"', type: 'Hackathon', date: '2025-10-20', description: 'A 24-hour competitive programming event for all students.' },
    { id: 'EVT002', title: 'Workshop on Modern Web Frameworks', type: 'Workshop', date: '2025-10-15', description: 'A hands-on workshop covering React, Vue, and Svelte.' },
    { id: 'EVT003', title: 'Guest Seminar on Quantum Computing', type: 'Seminar', date: '2025-10-12', description: 'Guest lecture by Dr. Evelyn Reed from the Institute of Quantum Physics.' },
    { id: 'EVT004', title: 'Notice: Mid-Term Exam Schedule', type: 'Notice', date: '2025-10-05', description: 'The schedule for the upcoming mid-term examinations has been published on the notice board.' },
];