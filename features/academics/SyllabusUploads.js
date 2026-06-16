export function renderSyllabusUploads(rootElement, { courses, uploadedSyllabi, onUploadSyllabus, onRemoveSyllabus }) {
    let selectedFile = null;

    const render = () => {
        const courseOptions = courses.map(course => {
            const hasSyllabus = !!uploadedSyllabi[course.code];
            const statusText = hasSyllabus ? '(Uploaded - will be replaced)' : '';
            return `<option value="${course.code}">${course.name} (${course.code}) ${statusText}</option>`;
        }).join('');

        const syllabusStatusRows = courses.map(course => {
            const isUploaded = !!uploadedSyllabi[course.code];
            const fileURL = isUploaded ? uploadedSyllabi[course.code] : '#';

            const managementActions = isUploaded ? `
                <div class="flex items-center gap-2 ml-4">
                    <button data-course-code="${course.code}" class="edit-syllabus-btn text-sm text-blue-600 hover:underline font-medium">Edit</button>
                    <span class="text-gray-300">|</span>
                    <button data-course-code="${course.code}" class="remove-syllabus-btn text-sm text-red-600 hover:underline font-medium">Remove</button>
                </div>
            ` : '';

            return `
                <tr class="border-b last:border-b-0 hover:bg-gray-50">
                    <td class="px-4 py-3">${course.code}</td>
                    <td class="px-4 py-3 font-medium text-gray-800">${course.name}</td>
                    <td class="px-4 py-3">
                        ${isUploaded
                            ? '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Uploaded</span>'
                            : '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-md">Not Uploaded</span>'
                        }
                    </td>
                    <td class="px-4 py-3 flex items-center">
                        <a href="${fileURL}" 
                           class="text-sm text-blue-600 hover:underline ${!isUploaded ? 'text-gray-400 pointer-events-none' : ''}" 
                           ${!isUploaded ? 'aria-disabled="true" tabindex="-1"' : 'target="_blank" rel="noopener noreferrer"'}>
                           View
                        </a>
                        ${managementActions}
                    </td>
                </tr>
            `;
        }).join('');

        const content = `
            <div>
                <h2 class="text-3xl font-bold text-gray-800">Syllabus Upload and Management</h2>
                <hr class="my-6"/>
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    
                    <!-- Left Column: Upload Form -->
                    <div class="lg:col-span-2">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">Upload or Replace Syllabus</h3>
                        <form id="upload-syllabus-form" class="space-y-6">
                            <div>
                                <label for="course-select" class="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                                <select id="course-select" name="course" required class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="">-- Choose a course --</option>
                                    ${courseOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Syllabus File (PDF only)</label>
                                <div class="flex items-center">
                                    <label for="syllabus-file" class="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                        Choose File
                                    </label>
                                    <input type="file" id="syllabus-file" name="syllabusFile" accept=".pdf" class="sr-only"/>
                                    <span id="file-name-display" class="ml-3 text-sm text-gray-500 truncate">${selectedFile ? selectedFile.name : 'No file chosen'}</span>
                                </div>
                            </div>
                            <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors text-base">
                                Upload Syllabus
                            </button>
                        </form>
                    </div>

                    <!-- Right Column: Status Table -->
                    <div class="lg:col-span-3">
                         <h3 class="text-xl font-semibold text-gray-800 mb-4">Current Syllabus Status</h3>
                         <div class="bg-white rounded-lg shadow-sm border">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left table-auto">
                                    <thead class="bg-gray-50 border-b">
                                        <tr>
                                            <th class="px-4 py-3 font-semibold text-gray-600">Code</th>
                                            <th class="px-4 py-3 font-semibold text-gray-600">Course Name</th>
                                            <th class="px-4 py-3 font-semibold text-gray-600">Status</th>
                                            <th class="px-4 py-3 font-semibold text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${syllabusStatusRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        const form = document.getElementById('upload-syllabus-form');
        const fileInput = document.getElementById('syllabus-file');
        const courseSelect = document.getElementById('course-select');

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseCode = courseSelect.value;

            if (!courseCode) {
                alert('Please select a course.');
                return;
            }
            if (!selectedFile) {
                alert('Please select a file to upload.');
                return;
            }
            
            const fileURL = URL.createObjectURL(selectedFile);
            onUploadSyllabus(courseCode, fileURL);
            
            selectedFile = null;
            form.reset();
            document.getElementById('file-name-display').textContent = 'No file chosen';
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
            } else {
                selectedFile = null;
            }
            const fileNameDisplay = document.getElementById('file-name-display');
            if(fileNameDisplay) {
              fileNameDisplay.textContent = selectedFile ? selectedFile.name : 'No file chosen';
            }
        });

        document.querySelectorAll('.edit-syllabus-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseCode = e.currentTarget.dataset.courseCode;
                courseSelect.value = courseCode;
                document.getElementById('upload-syllabus-form').scrollIntoView({ behavior: 'smooth' });
                fileInput.click();
            });
        });

        document.querySelectorAll('.remove-syllabus-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseCode = e.currentTarget.dataset.courseCode;
                const course = courses.find(c => c.code === courseCode);
                if (confirm(`Are you sure you want to remove the syllabus for "${course.name}"?`)) {
                    onRemoveSyllabus(courseCode);
                }
            });
        });
    };

    render();
}