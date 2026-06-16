
import { Card } from '../../components/ui/Card.js';
import { UserRole } from '../../types.js';

export function renderAcademicManagement(rootElement, { user, courses, faculty, onUpdateCourseFaculty, onAddCourse, onRemoveCourse }) {
    let editingCourseCode = null;
    let showAddForm = false;

    const isStudent = user.role === UserRole.Student;

    const render = () => {
        const courseRows = courses.map(course => {
            const isEditing = course.code === editingCourseCode;

            const facultyOptions = faculty.map(f =>
                `<option value="${f.name}" ${course.faculty === f.name ? 'selected' : ''}>${f.name}</option>`
            ).join('');

            const facultyCell = isEditing && !isStudent
                ? `
                    <select id="faculty-select-${course.code}" class="p-2 border rounded-lg w-full">
                        <option value="Unassigned" ${course.faculty === 'Unassigned' ? 'selected' : ''}>Unassigned</option>
                        ${facultyOptions}
                    </select>
                  `
                : course.faculty;

            const actionCell = isStudent ? '' : `
                <td class="p-3">
                    ${isEditing ? `
                        <div class="flex gap-2">
                            <button class="save-course-btn text-green-600 hover:underline" data-course-code="${course.code}">Save</button>
                            <button class="cancel-edit-btn text-gray-600 hover:underline" data-course-code="${course.code}">Cancel</button>
                        </div>
                    ` : `
                        <div class="flex gap-4">
                            <button class="edit-course-btn text-blue-600 hover:underline" data-course-code="${course.code}">Edit</button>
                            <button class="remove-course-btn text-red-600 hover:underline" data-course-code="${course.code}">Remove</button>
                        </div>
                    `}
                </td>
            `;

            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">${course.code}</td>
                    <td class="p-3 font-medium text-gray-800">${course.name}</td>
                    <td class="p-3">${course.credits}</td>
                    <td class="p-3">${facultyCell}</td>
                    ${actionCell}
                </tr>
            `;
        }).join('');
        
        const actionHeader = isStudent ? '' : `<th class="p-3 font-semibold text-gray-600">Actions</th>`;

        const tableContent = courses.length > 0 ? `
            <div class="overflow-x-auto">
                <table class="w-full text-left table-auto">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="p-3 font-semibold text-gray-600">Course Code</th>
                            <th class="p-3 font-semibold text-gray-600">Course Name</th>
                            <th class="p-3 font-semibold text-gray-600">Credits</th>
                            <th class="p-3 font-semibold text-gray-600">Faculty</th>
                            ${actionHeader}
                        </tr>
                    </thead>
                    <tbody>
                        ${courseRows}
                    </tbody>
                </table>
            </div>
        ` : `
            <div class="text-center p-8 text-gray-500">
                <h3 class="text-xl font-semibold mb-2">No Courses Found</h3>
                <p>Get started by adding the first course to the system.</p>
            </div>
        `;

        const addCourseForm = showAddForm && !isStudent ? `
            <div class="my-4 p-4 bg-gray-50 rounded-lg border">
                <h4 class="text-lg font-semibold text-gray-700 mb-4">Add New Course</h4>
                <form id="add-course-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div class="flex flex-col">
                        <label class="mb-1 text-sm font-medium">Course Code</label>
                        <input type="text" name="code" class="p-2 border rounded-lg" placeholder="e.g., CS101" required />
                    </div>
                    <div class="flex flex-col">
                        <label class="mb-1 text-sm font-medium">Course Name</label>
                        <input type="text" name="name" class="p-2 border rounded-lg" placeholder="e.g., Intro to Programming" required />
                    </div>
                    <div class="flex flex-col">
                        <label class="mb-1 text-sm font-medium">Credits</label>
                        <input type="number" name="credits" class="p-2 border rounded-lg" placeholder="e.g., 4" required min="1" />
                    </div>
                    <button type="submit" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Save Course</button>
                </form>
            </div>
        ` : '';

        const managementHeader = isStudent ? '' : `
             <div class="flex justify-end mb-4">
                 <button id="toggle-add-course-form-btn" class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">
                    ${showAddForm ? 'Cancel' : 'Add Course'}
                </button>
            </div>
        `;

        const title = isStudent ? "Course Timetable" : "Academic Management - Courses";

        const content = Card({
            title: title,
            children: `
                ${managementHeader}
                ${addCourseForm}
                ${tableContent}
            `
        });

        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        if (isStudent) return; // No listeners for students

        rootElement.querySelectorAll('.edit-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                editingCourseCode = e.target.dataset.courseCode;
                render();
            });
        });

        rootElement.querySelectorAll('.cancel-edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                editingCourseCode = null;
                render();
            });
        });

        rootElement.querySelectorAll('.save-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseCode = e.target.dataset.courseCode;
                const selectElement = document.getElementById(`faculty-select-${courseCode}`);
                const newFacultyName = selectElement.value;
                onUpdateCourseFaculty(courseCode, newFacultyName);
                editingCourseCode = null;
            });
        });

        rootElement.querySelectorAll('.remove-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseCode = e.target.dataset.courseCode;
                const course = courses.find(c => c.code === courseCode);
                if (confirm(`Are you sure you want to remove the course "${course.name}" (${course.code})? This will also remove all associated student marks.`)) {
                    onRemoveCourse(courseCode);
                }
            });
        });

        document.getElementById('toggle-add-course-form-btn').addEventListener('click', () => {
            showAddForm = !showAddForm;
            render();
        });

        if (showAddForm) {
            document.getElementById('add-course-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newCourse = {
                    code: formData.get('code'),
                    name: formData.get('name'),
                    credits: parseInt(formData.get('credits'), 10),
                };
                onAddCourse(newCourse);
            });
        }
    };

    render();
}
