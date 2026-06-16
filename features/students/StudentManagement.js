import { Card } from '../../components/ui/Card.js';

export function renderStudentManagement(rootElement, { students, onAddStudent, onRemoveStudents }) {
    let showAddForm = false;
    let isRemoveMode = false;
    let selectedStudents = new Set();

    const calculateAverage = (marks) => {
        const courseCodes = Object.keys(marks);
        if (courseCodes.length === 0) return 'N/A';
        
        let totalScore = 0;
        let coursesWithMarks = 0;
    
        for (const code of courseCodes) {
            const subject = marks[code];
            if (subject) {
                const ut1 = subject.unitTest1 || 0;
                const ut2 = subject.unitTest2 || 0;
                const final = subject.final || 0;
                
                if (subject.unitTest1 !== undefined || subject.unitTest2 !== undefined || subject.final !== undefined) {
                    const total = ((ut1 + ut2) / 2) + final;
                    totalScore += total;
                    coursesWithMarks++;
                }
            }
        }
    
        if (coursesWithMarks === 0) return 'N/A';
        
        const average = totalScore / coursesWithMarks;
        return `${average.toFixed(2)}%`;
    };
    
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            students.forEach(student => selectedStudents.add(student.id));
        } else {
            selectedStudents.clear();
        }
        render();
    };

    const toggleStudentSelection = (studentId) => {
        if (selectedStudents.has(studentId)) {
            selectedStudents.delete(studentId);
        } else {
            selectedStudents.add(studentId);
        }
        render();
    };
    
    const handleRemoveClick = () => {
        if (selectedStudents.size === 0) {
            alert('Please select at least one student to remove.');
            return;
        }

        const idsToRemove = Array.from(selectedStudents);
        const confirmation = confirm(`Are you sure you want to remove ${idsToRemove.length} student(s)? This action cannot be undone.`);

        if (confirmation) {
            onRemoveStudents(idsToRemove);
        }
    };
    
    const handleExportPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Student List", 14, 22);

        const head = [['ID', 'Name', 'Email', 'Year', 'Attendance', 'Average Marks']];
        const body = students.map(student => [
            student.id,
            student.name,
            student.email,
            student.year,
            `${student.attendance}%`,
            calculateAverage(student.subjectMarks)
        ]);

        doc.autoTable({
            head: head,
            body: body,
            startY: 30,
        });

        doc.save('student-list.pdf');
    };

    const handleExportExcel = () => {
        const data = students.map(student => ({
            'ID': student.id,
            'Name': student.name,
            'Email': student.email,
            'Year': student.year,
            'Attendance (%)': student.attendance,
            'Average Marks': calculateAverage(student.subjectMarks)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "student-list.xlsx");
    };


    const render = () => {
        const studentRows = students.length > 0
            ? students.map(student => `
            <tr class="border-b hover:bg-gray-50">
                 ${isRemoveMode ? `
                    <td class="p-3 text-center">
                        <input type="checkbox" class="student-checkbox h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded" data-id="${student.id}" ${selectedStudents.has(student.id) ? 'checked' : ''}>
                    </td>
                ` : ''}
                <td class="p-3">${student.id}</td>
                <td class="p-3 font-medium text-gray-800">${student.name}</td>
                <td class="p-3">${student.email}</td>
                <td class="p-3">${student.year}</td>
                <td class="p-3">${student.attendance}%</td>
                <td class="p-3 font-semibold">${calculateAverage(student.subjectMarks)}</td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="${isRemoveMode ? '7' : '6'}" class="text-center p-8 text-gray-500">
                    <h3 class="text-xl font-semibold mb-2">No Students Found</h3>
                    <p>Get started by adding the first student to the system.</p>
                </td>
            </tr>
        `;


        const removeModeButtons = isRemoveMode ? `
            <button 
                id="confirm-remove-btn"
                class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 disabled:bg-red-300 disabled:cursor-not-allowed ${selectedStudents.size > 0 ? 'shadow-md transform hover:scale-105' : ''}"
                ${selectedStudents.size === 0 ? 'disabled' : ''}
            >
                Confirm & Delete (${selectedStudents.size})
            </button>
        ` : '';

        const content = Card({
            title: "Student Management",
            children: `
                <div class="mb-4 flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search students..."
                        class="w-1/3 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                     <div class="flex gap-2">
                        <button id="export-pdf-btn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Export PDF</button>
                        <button id="export-excel-btn" class="bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition-colors">Export Excel</button>
                        ${removeModeButtons}
                        ${students.length > 0 ? `
                            <button 
                                id="toggle-remove-mode-btn"
                                class="${isRemoveMode ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                ${isRemoveMode ? 'Cancel Removal' : 'Remove Student'}
                            </button>
                        ` : ''}
                        <button 
                            id="toggle-add-form-btn"
                            class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors ${isRemoveMode ? 'hidden' : ''}"
                        >
                            ${showAddForm ? 'Cancel' : 'Add Student'}
                        </button>
                    </div>
                </div>

                ${showAddForm ? `
                    <div class="my-4 p-4 bg-gray-50 rounded-lg border">
                        <form id="add-student-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div class="flex flex-col">
                                <label for="name" class="mb-1 text-sm font-medium">Name</label>
                                <input type="text" name="name" class="p-2 border rounded-lg" placeholder="Student Name" required />
                            </div>
                            <div class="flex flex-col">
                                 <label for="email" class="mb-1 text-sm font-medium">Email</label>
                                <input type="email" name="email" class="p-2 border rounded-lg" placeholder="student@example.com" required />
                            </div>
                            <div class="flex flex-col">
                                 <label for="year" class="mb-1 text-sm font-medium">Year</label>
                                <input type="number" name="year" class="p-2 border rounded-lg" placeholder="e.g., 3" required />
                            </div>
                            <button type="submit" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Save Student</button>
                        </form>
                    </div>
                ` : ''}

                <div class="overflow-x-auto">
                    <table class="w-full text-left table-auto">
                        <thead class="bg-gray-100">
                            <tr>
                                ${isRemoveMode ? `
                                    <th class="p-3 text-center">
                                        <input type="checkbox" id="select-all-checkbox" class="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded">
                                    </th>
                                ` : ''}
                                <th class="p-3 font-semibold text-gray-600">ID</th>
                                <th class="p-3 font-semibold text-gray-600">Name</th>
                                <th class="p-3 font-semibold text-gray-600">Email</th>
                                <th class="p-3 font-semibold text-gray-600">Year</th>
                                <th class="p-3 font-semibold text-gray-600">Attendance</th>
                                <th class="p-3 font-semibold text-gray-600">Average Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentRows}
                        </tbody>
                    </table>
                </div>
            `
        });
        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        document.getElementById('toggle-add-form-btn')?.addEventListener('click', () => {
            showAddForm = !showAddForm;
            render();
        });

        document.getElementById('toggle-remove-mode-btn')?.addEventListener('click', () => {
            isRemoveMode = !isRemoveMode;
            if (!isRemoveMode) {
                selectedStudents.clear(); // Clear selection on cancel
            }
            render();
        });
        
        if (isRemoveMode) {
            document.getElementById('confirm-remove-btn')?.addEventListener('click', handleRemoveClick);
            document.getElementById('select-all-checkbox')?.addEventListener('change', toggleSelectAll);
            document.querySelectorAll('.student-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => toggleStudentSelection(checkbox.dataset.id));
            });
        }

        if (showAddForm) {
            document.getElementById('add-student-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newStudent = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    year: parseInt(formData.get('year'), 10),
                };
                onAddStudent(newStudent);
            });
        }

        document.getElementById('export-pdf-btn')?.addEventListener('click', handleExportPdf);
        document.getElementById('export-excel-btn')?.addEventListener('click', handleExportExcel);
    };

    render();
}