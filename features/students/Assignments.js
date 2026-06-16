import { Card } from '../../components/ui/Card.js';

export function renderAssignments(rootElement) {
    // This state is local to the component, so submissions will reset on page navigation.
    let assignments = [
        { id: 1, title: 'Report on Advanced Algorithms', course: 'CS301', assignedDate: '2025-09-01', dueDate: '2025-09-15', status: 'Pending' },
        { id: 2, title: 'Implementation of Binary Search Tree', course: 'CS201', assignedDate: '2025-08-25', dueDate: '2025-09-10', status: 'Submitted', submissionDate: '2024-11-08', fileName: 'BST_Implementation.pdf' },
        { id: 3, title: 'Compiler Design Project Proposal', course: 'CS405', assignedDate: '2025-09-05', dueDate: '2025-09-20', status: 'Pending' },
        { 
            id: 4, 
            title: 'Web Architecture Case Study', 
            course: 'IT401', 
            assignedDate: '2025-08-20', 
            dueDate: '2025-09-05', 
            status: 'Graded', 
            grade: 'A',
        },
    ];

    const handleFileUpload = (assignmentId, file) => {
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
            assignments[assignmentIndex] = {
                ...assignments[assignmentIndex],
                status: 'Submitted',
                submissionDate: new Date().toISOString().split('T')[0],
                fileName: file.name
            };
            alert(`Successfully submitted '${file.name}' for assignment '${assignments[assignmentIndex].title}'.`);
            render(); // Re-render the component to show the updated status
        }
    };

    const render = () => {
        const assignmentCards = assignments.map(assignment => {
            let statusBadge = '';
            let actionContent = '';

            switch (assignment.status) {
                case 'Pending':
                    statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-md">Pending</span>`;
                    actionContent = `
                        <button aria-label="Upload file for ${assignment.title}" data-assignment-id="${assignment.id}" class="upload-btn bg-primary text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-800 transition-colors text-sm">
                            Upload File
                        </button>
                        <input type="file" class="hidden" data-assignment-id="${assignment.id}" aria-hidden="true" />
                    `;
                    break;
                case 'Submitted':
                    statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Submitted</span>`;
                    actionContent = `
                        <div class="flex items-center gap-2">
                             <div class="text-sm text-gray-600 text-left flex-grow">
                                <p>On: ${assignment.submissionDate}</p>
                                <p class="truncate" title="${assignment.fileName}">File: ${assignment.fileName}</p>
                            </div>
                            <button 
                                aria-label="Download submitted file for ${assignment.title}" 
                                data-assignment-id="${assignment.id}" 
                                class="download-btn bg-secondary text-primary font-bold p-2 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0"
                                title="Download '${assignment.fileName}'"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    `;
                    break;
                case 'Graded':
                    statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-md">Graded</span>`;
                    actionContent = `
                        <div class="text-right">
                            <p class="text-lg font-bold text-primary">Grade: ${assignment.grade}</p>
                        </div>
                    `;
                    break;
            }

            return `
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center gap-4">
                    <div class="flex-grow">
                        <h3 class="text-lg font-bold text-gray-800">${assignment.title}</h3>
                        <p class="text-sm text-gray-600">${assignment.course} | Assigned: ${assignment.assignedDate} | Due: ${assignment.dueDate}</p>
                    </div>
                    <div class="flex items-center gap-4 text-right flex-shrink-0">
                        <div class="w-24 text-center">${statusBadge}</div>
                        <div class="w-56 text-center">${actionContent}</div>
                    </div>
                </div>
            `;
        }).join('');

        const content = Card({
            title: "My Assignments",
            children: `
                <p class="mb-6 text-gray-600">Here is a list of your current and past assignments. Upload your files before the due date.</p>
                <div class="space-y-4">
                    ${assignmentCards.length > 0 ? assignmentCards : '<p class="text-center text-gray-500 py-4">No assignments found.</p>'}
                </div>
            `
        });

        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        rootElement.querySelectorAll('.upload-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assignmentId = e.currentTarget.dataset.assignmentId;
                const fileInput = rootElement.querySelector(`input[type="file"][data-assignment-id="${assignmentId}"]`);
                if (fileInput) {
                    fileInput.click();
                }
            });
        });

        rootElement.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const assignmentId = parseInt(e.target.dataset.assignmentId, 10);
                    handleFileUpload(assignmentId, file);
                }
            });
        });

        rootElement.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assignmentId = parseInt(e.currentTarget.dataset.assignmentId, 10);
                const assignment = assignments.find(a => a.id === assignmentId);
                if (assignment) {
                    // In a real app, this would trigger a file download.
                    // For this mock, we'll just show an alert.
                    alert(`Downloading '${assignment.fileName}'...`);
                }
            });
        });
    };

    render();
}
