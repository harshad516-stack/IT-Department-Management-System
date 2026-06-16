import { Card } from '../../components/ui/Card.js';

export function renderUploadMarks(rootElement, { setActiveComponent, courses, uploadedMarksheets, uploadedAssignmentMarksheets, uploadedLabMarksheets, uploadedFinalMarksheets, onUploadMarksheetPdf, onRemoveMarksheetPdf }) {

    let state = {
        activeTab: 'internal', // 'internal', 'assignment', 'lab', 'final'
        selectedFile: null,
    };

    const setState = (newState, shouldRender = true) => {
        state = { ...state, ...newState };
        if (shouldRender) {
            render();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setState({ selectedFile: file });
        } else {
            if (file) alert('Please select a valid PDF file.');
            setState({ selectedFile: null });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!state.selectedFile) {
            alert('Please select a file to upload.');
            return;
        }

        const formData = new FormData(e.target);
        // Use a default key for final marks, which are not course-specific
        const courseCode = formData.get('course') || 'FINAL_SEMESTER_RESULTS'; 
        const marksheetType = state.activeTab;
        
        const fileURL = URL.createObjectURL(state.selectedFile);
        onUploadMarksheetPdf(courseCode, marksheetType, fileURL);

        setState({ selectedFile: null });
        e.target.reset();
    };

    const renderManualUpload = () => {
        const tabs = [
            { id: 'internal', label: 'Internal Marks' },
            { id: 'assignment', label: 'Assignment Marks' },
            { id: 'lab', label: 'Lab Marks' },
            { id: 'final', label: 'Final Marksheet' },
        ];
        
        const tabsHtml = tabs.map(tab => `
            <button data-tab="${tab.id}" class="tab-btn flex-shrink-0 py-2 px-4 text-sm sm:text-base ${state.activeTab === tab.id ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}">${tab.label}</button>
        `).join('');

        const isFinalsTab = state.activeTab === 'final';
        
        const courseOptions = courses.map(course => 
            `<option value="${course.code}">${course.name} (${course.code})</option>`
        ).join('');
        
        const createManagementActions = (isUploaded, courseCode, marksheetType) => {
            if (!isUploaded) return '';
            return `
                <div class="flex items-center gap-2 ml-4">
                    <button data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" class="edit-marksheet-btn text-sm text-blue-600 hover:underline font-medium">Edit</button>
                    <span class="text-gray-300">|</span>
                    <button data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" class="remove-marksheet-btn text-sm text-red-600 hover:underline font-medium">Remove</button>
                    <input type="file" class="hidden edit-file-input" accept=".pdf" data-course-code="${courseCode}" data-marksheet-type="${marksheetType}" />
                </div>
            `;
        };

        const renderForm = `
            <form id="upload-marks-pdf-form" class="space-y-4">
                ${!isFinalsTab ? `
                    <div>
                        <label for="course-select" class="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                        <select id="course-select" name="course" required class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="">-- Choose a course --</option>
                            ${courseOptions}
                        </select>
                    </div>` : `
                    <div class="p-3 bg-blue-50 border-l-4 border-primary text-primary-dark">
                        <p class="font-semibold">Uploading Final Marksheet</p>
                        <p class="text-sm">This uploads a single consolidated marksheet for the semester.</p>
                    </div>
                `}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Marksheet File (PDF only)</label>
                    <div class="flex items-center">
                        <label for="marks-pdf-file" class="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Choose File</label>
                        <input type="file" id="marks-pdf-file" name="marksheetFile" accept=".pdf" class="sr-only"/>
                        <span id="file-name-display" class="ml-3 text-sm text-gray-500 truncate">${state.selectedFile ? state.selectedFile.name : 'No file chosen'}</span>
                    </div>
                </div>
                <button type="submit" class="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800">Upload PDF</button>
            </form>`;

        let dataMap, tableRows;
        if (isFinalsTab) {
            const finalUrl = uploadedFinalMarksheets['FINAL_SEMESTER_RESULTS'];
            const isUploaded = !!finalUrl;
            tableRows = `
                <tr class="hover:bg-gray-50">
                    <td class="p-2 font-medium">Final Semester Results</td>
                    <td class="p-2">${isUploaded ? '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Uploaded</span>' : '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-md">Not Uploaded</span>'}</td>
                    <td class="p-2 flex items-center">
                        <a href="${finalUrl || '#'}" class="text-sm text-blue-600 hover:underline ${!isUploaded ? 'text-gray-400 pointer-events-none' : ''}" target="_blank">View</a>
                        ${createManagementActions(isUploaded, 'FINAL_SEMESTER_RESULTS', 'final')}
                    </td>
                </tr>`;
        } else {
            dataMap = { internal: uploadedMarksheets, assignment: uploadedAssignmentMarksheets, lab: uploadedLabMarksheets }[state.activeTab];
            tableRows = courses.map(course => {
                const isUploaded = !!dataMap[course.code];
                const fileURL = isUploaded ? dataMap[course.code] : '#';
                return `<tr class="hover:bg-gray-50">
                            <td class="p-2 font-medium">${course.name}</td>
                            <td class="p-2">${isUploaded ? '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Uploaded</span>' : '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-md">Not Uploaded</span>'}</td>
                            <td class="p-2 flex items-center">
                                <a href="${fileURL}" class="text-sm text-blue-600 hover:underline ${!isUploaded ? 'text-gray-400 pointer-events-none' : ''}" target="_blank">View</a>
                                ${createManagementActions(isUploaded, course.code, state.activeTab)}
                            </td>
                        </tr>`;
            }).join('');
        }
        
        const tableHead = isFinalsTab 
            ? `<th class="p-2 font-semibold">Document</th>`
            : `<th class="p-2 font-semibold">Course Name</th>`;

        return `
            <div class="flex border-b mb-4 overflow-x-auto">${tabsHtml}</div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>${renderForm}</div>
                <div>
                    <div class="overflow-auto border rounded-lg max-h-96">
                        <table class="w-full text-left table-auto text-sm">
                            <thead class="bg-gray-100 sticky top-0"><tr>${tableHead}<th class="p-2 font-semibold">Status</th><th class="p-2 font-semibold">Action</th></tr></thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    };

    const renderAIUpload = () => {
        const uploadOptions = [
            { title: 'Final Marksheet', component: 'DocumentAI' },
            { title: 'Internal Marks', component: 'UploadResults' },
            { title: 'Assignment Marks', component: 'UploadAssignmentMarks' },
            { title: 'Lab Marks', component: 'UploadLabMarks' },
        ];
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${uploadOptions.map(opt => `
                    <button data-component="${opt.component}" class="ai-option-card bg-gray-50 text-primary font-semibold rounded-lg p-4 text-center transition-colors hover:bg-blue-100">
                        ${opt.title}
                    </button>`).join('')}
            </div>`;
    };

    const render = () => {
        const content = `
            <div>
                <h2 class="text-3xl font-bold text-gray-800 mb-6">Upload Marks Hub</h2>
                ${Card({
                    title: "AI-Powered Upload from Image",
                    children: `<p class="text-sm text-gray-600 mb-4">Use this option to upload an image of a marksheet. The system will automatically extract, format, and save the marks.</p>${renderAIUpload()}`
                })}
                <hr class="my-8" />
                ${Card({
                    title: "Manual PDF Upload",
                    children: `<p class="text-sm text-gray-600 mb-4">Use this option if you already have a formatted PDF marksheet to upload directly.</p>${renderManualUpload()}`
                })}
            </div>
        `;

        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        rootElement.querySelectorAll('.ai-option-card').forEach(card => {
            card.addEventListener('click', () => setActiveComponent(card.dataset.component));
        });
        rootElement.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => setState({ activeTab: btn.dataset.tab, selectedFile: null }));
        });
        document.getElementById('upload-marks-pdf-form')?.addEventListener('submit', handleSubmit);
        document.getElementById('marks-pdf-file')?.addEventListener('change', handleFileUpload);
        
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

    render();
}