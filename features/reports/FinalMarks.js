import { Card } from '../../components/ui/Card.js';

export function renderFinalMarks(rootElement, { students, courses, onUpdateMarks }) {

    let isEditing = false;
    let changes = {}; // Stores changes like { "S001_CS301_final": 55 }

    const getMark = (studentId, courseCode, markType) => {
        const key = `${studentId}_${courseCode}_${markType}`;
        if (changes.hasOwnProperty(key)) {
            const value = changes[key];
            return value === null ? undefined : value;
        }
        const student = students.find(s => s.id === studentId);
        return student?.subjectMarks[courseCode]?.[markType];
    };

    const calculateTotalMark = (studentId, courseCode) => {
        const ut1 = getMark(studentId, courseCode, 'unitTest1');
        const ut2 = getMark(studentId, courseCode, 'unitTest2');
        const final = getMark(studentId, courseCode, 'final');
    
        if (ut1 === undefined && ut2 === undefined && final === undefined) {
            return '';
        }
        const total = (((ut1 ?? 0) + (ut2 ?? 0)) / 2) + (final ?? 0);
        return total.toFixed(2);
    };

    const calculateAverage = (studentId) => {
        let totalScore = 0;
        let coursesWithMarks = 0;
    
        courses.forEach(course => {
            const total = parseFloat(calculateTotalMark(studentId, course.code));
            if (!isNaN(total) && total > 0) {
                totalScore += total;
                coursesWithMarks++;
            }
        });
    
        if (coursesWithMarks === 0) return '';
        const average = totalScore / coursesWithMarks;
        return `${average.toFixed(2)}%`;
    };
    
    const handleExportPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });

        doc.text("Student Final Marks Report", 14, 22);

        const headRow1 = [{ content: 'ID', rowSpan: 2 }, { content: 'Name', rowSpan: 2 }];
        courses.forEach(course => {
            headRow1.push({ content: `${course.name} (${course.code})`, colSpan: 4, styles: { halign: 'center' } });
        });
        headRow1.push({ content: 'Overall Average', rowSpan: 2 });
        
        const headRow2 = [];
        courses.forEach(() => {
            headRow2.push(...['UT1', 'UT2', 'Final', 'Total']);
        });

        const body = students.map(student => {
            const row = [student.id, student.name];
            courses.forEach(course => {
                row.push(getMark(student.id, course.code, 'unitTest1') ?? '-');
                row.push(getMark(student.id, course.code, 'unitTest2') ?? '-');
                row.push(getMark(student.id, course.code, 'final') ?? '-');
                row.push(calculateTotalMark(student.id, course.code) || '-');
            });
            row.push(calculateAverage(student.id) || '-');
            return row;
        });

        doc.autoTable({
            head: [headRow1, headRow2],
            body: body,
            startY: 30,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', halign: 'center' },
            columnStyles: {
                1: { cellWidth: 'auto' }
            }
        });

        doc.save('final-marks-report.pdf');
    };
    
    const handleExportExcel = () => {
        const header1 = ["ID", "Name"];
        const header2 = ["", ""];
        
        courses.forEach(course => {
            header1.push(`${course.name} (${course.code})`, null, null, null);
            header2.push('UT1', 'UT2', 'Final', 'Total');
        });
        header1.push('Overall Average');
        header2.push('');

        const data = [header1, header2];

        students.forEach(student => {
            const row = [student.id, student.name];
            courses.forEach(course => {
                row.push(getMark(student.id, course.code, 'unitTest1') ?? null);
                row.push(getMark(student.id, course.code, 'unitTest2') ?? null);
                row.push(getMark(student.id, course.code, 'final') ?? null);
                row.push(parseFloat(calculateTotalMark(student.id, course.code)) || null);
            });
            row.push(calculateAverage(student.id) || null);
            data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        const merges = [];
        // Merge header cells
        let col = 2;
        courses.forEach(() => {
            merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + 3 } });
            col += 4;
        });
        // Merge ID, Name, and Average headers
        merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
        merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
        merges.push({ s: { r: 0, c: col }, e: { r: 1, c: col } });
        ws['!merges'] = merges;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Final Marks");
        XLSX.writeFile(wb, "final-marks-report.xlsx");
    };

    const render = () => {
        const hasChanges = Object.keys(changes).length > 0;

        const courseHeaders = courses.map(course => 
            `<th colspan="4" class="p-3 font-semibold text-gray-600 border-b-2 border-gray-200 text-center">${course.name} (${course.code})</th>`
        ).join('');

        const subHeaders = courses.map(() => `
            <th class="p-2 font-semibold text-gray-600 border-b-2 border-gray-200 text-center text-sm">UT1</th>
            <th class="p-2 font-semibold text-gray-600 border-b-2 border-gray-200 text-center text-sm">UT2</th>
            <th class="p-2 font-semibold text-gray-600 border-b-2 border-gray-200 text-center text-sm">Final</th>
            <th class="p-2 font-semibold text-gray-600 border-b-2 border-gray-200 text-center text-sm bg-gray-200">Total</th>
        `).join('');

        const studentRows = students.length > 0 
            ? students.map(student => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">${student.id}</td>
                    <td class="p-3 font-medium text-gray-800">${student.name}</td>
                    ${courses.map(course => {
                        const markTypes = ['unitTest1', 'unitTest2', 'final'];
                        const markInputs = markTypes.map(markType => {
                            const key = `${student.id}_${course.code}_${markType}`;
                            const originalMark = students.find(s => s.id === student.id)?.subjectMarks[course.code]?.[markType];
                            const currentValue = getMark(student.id, course.code, markType) ?? '';
                            const isChanged = changes.hasOwnProperty(key) && changes[key] !== originalMark;
                            const max = markType === 'final' ? 80 : 20;

                            const inputClasses = `mark-input w-full text-center p-1 rounded-md transition-colors duration-200 ${
                                isEditing 
                                ? 'bg-white border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none' 
                                : 'bg-transparent border-none'
                            } ${isChanged ? 'bg-yellow-100' : ''}`;

                            return `
                                <td class="p-1 text-center">
                                    <input 
                                        type="number" 
                                        value="${currentValue}"
                                        min="0"
                                        max="${max}"
                                        placeholder="-"
                                        class="${inputClasses}"
                                        data-student-id="${student.id}"
                                        data-course-code="${course.code}"
                                        data-mark-type="${markType}"
                                        ${!isEditing ? 'disabled' : ''}
                                    />
                                </td>`;
                        }).join('');

                        const total = calculateTotalMark(student.id, course.code);

                        return `
                            ${markInputs}
                            <td class="p-3 font-bold text-gray-800 text-center bg-gray-50">${total}</td>
                        `;
                    }).join('')}
                    <td class="p-3 font-bold text-gray-800 text-center">${calculateAverage(student.id)}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="${courses.length * 4 + 3}" class="text-center p-8 text-gray-500">No students have been added to the system yet.</td></tr>`;

        const actionButtons = isEditing ? `
            <div class="flex gap-2">
                <button id="save-marks-btn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" ${!hasChanges ? 'disabled' : ''}>
                    Save Changes
                </button>
                <button id="cancel-edit-btn" class="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                    Cancel
                </button>
            </div>
        ` : `
             <button id="edit-marks-btn" class="bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">
                Edit Marks
            </button>
        `;

        const content = Card({
            children: `
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 class="text-xl font-semibold text-gray-800">Manage Student Marks</h3>
                    <div class="flex items-center gap-4">
                        <button id="export-pdf-btn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">Export PDF</button>
                        <button id="export-excel-btn" class="bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition-colors text-sm">Export Excel</button>
                        ${actionButtons}
                    </div>
                </div>
                <p class="mb-4 text-gray-600">${isEditing ? 'You are in edit mode. Modify the marks below and click Save.' : 'This table shows a detailed breakdown of final marks. Click "Edit Marks" to make changes.'}</p>
                <div class="overflow-x-auto">
                    <table id="final-marks-table" class="w-full text-left table-auto border-collapse">
                        <thead class="bg-gray-100 align-middle">
                            <tr>
                                <th rowspan="2" class="p-3 font-semibold text-gray-600 border-b-2 border-gray-200">ID</th>
                                <th rowspan="2" class="p-3 font-semibold text-gray-600 border-b-2 border-gray-200">Name</th>
                                ${courseHeaders}
                                <th rowspan="2" class="p-3 font-semibold text-gray-600 border-b-2 border-gray-200 text-center">Overall Average</th>
                            </tr>
                             <tr>
                                ${subHeaders}
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

    const handleMarkChange = (e) => {
        const { studentId, courseCode, markType } = e.target.dataset;
        const value = e.target.value;
        const key = `${studentId}_${courseCode}_${markType}`;

        const originalStudent = students.find(s => s.id === studentId);
        const originalMark = originalStudent?.subjectMarks[courseCode]?.[markType];

        // If the new value is the same as the original, remove it from changes
        if (value === (originalMark?.toString() || '') || (value === '' && originalMark === undefined)) {
            delete changes[key];
        } else {
            changes[key] = value === '' ? null : parseFloat(value);
        }
        render();
    };
    
    const handleSaveChanges = () => {
        const updates = Object.entries(changes).map(([key, value]) => {
            const [studentId, courseCode, markType] = key.split('_');
            return { studentId, courseCode, markType, value };
        });

        if(updates.length > 0) {
            onUpdateMarks(updates);
        } else {
            // If no changes, just exit edit mode
            isEditing = false;
            changes = {};
            render();
        }
        // Parent component re-render will handle UI update
    };

    const attachEventListeners = () => {
        if (isEditing) {
            document.getElementById('save-marks-btn')?.addEventListener('click', handleSaveChanges);
            document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
                isEditing = false;
                changes = {};
                render();
            });
            document.querySelectorAll('.mark-input').forEach(input => {
                input.addEventListener('input', handleMarkChange);
            });
        } else {
            document.getElementById('edit-marks-btn')?.addEventListener('click', () => {
                isEditing = true;
                changes = {};
                render();
            });
        }
        
        document.getElementById('export-pdf-btn')?.addEventListener('click', handleExportPdf);
        document.getElementById('export-excel-btn')?.addEventListener('click', handleExportExcel);
    };
    
    render();
}