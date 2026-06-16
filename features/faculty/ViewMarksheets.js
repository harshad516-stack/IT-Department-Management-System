import { Card } from '../../components/ui/Card.js';

export function renderViewMarksheets(rootElement, { courses, uploadedMarksheets, uploadedAssignmentMarksheets, uploadedLabMarksheets, onUploadMarksheetPdf, onRemoveMarksheetPdf }) {
    
    const allUploadedCourses = new Set([
        ...Object.keys(uploadedMarksheets),
        ...Object.keys(uploadedAssignmentMarksheets),
        ...Object.keys(uploadedLabMarksheets),
    ]);

    if (allUploadedCourses.size === 0) {
        rootElement.innerHTML = Card({
            title: "View Uploaded Marksheets",
            children: '<p class="text-center text-gray-500 py-8">No marksheet documents have been uploaded to the system yet.</p>'
        });
        return;
    }

    const createLinkRow = (url, label, courseCode, marksheetType) => {
        const hasUrl = !!url;
        const link = hasUrl
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm">View PDF</a>`
            : `<span class="text-gray-400 font-medium text-sm">Not Uploaded</span>`;

        const managementActions = hasUrl ? `
            <div class="flex items-center gap-2 ml-4">
                <button data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" class="edit-marksheet-btn text-sm text-blue-600 hover:underline font-medium">Edit</button>
                <span class="text-gray-300">|</span>
                <button data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" class="remove-marksheet-btn text-sm text-red-600 hover:underline font-medium">Remove</button>
                <input type="file" class="hidden edit-file-input" accept=".pdf" data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" />
            </div>
        ` : '';

        return `
            <div class="flex justify-between items-center py-3 border-b last:border-b-0">
                <span class="text-gray-700">${label}</span>
                <div class="flex items-center">
                    ${link}
                    ${managementActions}
                </div>
            </div>
        `;
    };

    const courseCards = courses.filter(c => allUploadedCourses.has(c.code)).map(course => {
        const internalUrl = uploadedMarksheets[course.code];
        const assignmentUrl = uploadedAssignmentMarksheets[course.code];
        const labUrl = uploadedLabMarksheets[course.code];

        return `
            <div class="bg-white rounded-lg shadow-md p-4 border">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b">${course.name} (${course.code})</h3>
                <div class="space-y-1">
                    ${createLinkRow(internalUrl, 'Internal Marksheet', course.code, 'internal')}
                    ${createLinkRow(assignmentUrl, 'Assignment Marksheet', course.code, 'assignment')}
                    ${createLinkRow(labUrl, 'Lab Marksheet', course.code, 'lab')}
                </div>
            </div>`;
    }).join('');

    const content = Card({
        title: "View Uploaded Marksheets",
        children: `
            <p class="mb-6 text-gray-600">Below are the courses with uploaded marksheet documents. Click on a link to view the generated PDF.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${courseCards}
            </div>
        `
    });
    
    rootElement.innerHTML = content;
    
    const attachEventListeners = () => {
        rootElement.querySelectorAll('.remove-marksheet-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const { courseCode, marksheetType } = e.currentTarget.dataset;
                if (confirm(`Are you sure you want to remove the ${marksheetType} marksheet for ${courseCode}?`)) {
                    onRemoveMarksheetPdf(courseCode, marksheetType);
                }
            });
        });

        rootElement.querySelectorAll('.edit-marksheet-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const { courseCode, marksheetType } = e.currentTarget.dataset;
                const fileInput = rootElement.querySelector(`.edit-file-input[data-course-code="${courseCode}"][data-marksheet-type="${marksheetType}"]`);
                fileInput.click();
            });
        });

        rootElement.querySelectorAll('.edit-file-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const { courseCode, marksheetType } = e.currentTarget.dataset;
                    const fileURL = URL.createObjectURL(file);
                    onUploadMarksheetPdf(courseCode, marksheetType, fileURL);
                }
            });
        });
    };
    
    attachEventListeners();
}