
import { Card } from '../../components/ui/Card.js';

export function renderEnterStudentMarks(rootElement, { students, courses, onSaveAllMarks }) {
    let selectedStudentId = '';
    let marks = {};

    const render = () => {
        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
            marks = courses.reduce((acc, course) => {
                const subjectMark = student.subjectMarks[course.code];
                acc[course.code] = {
                    unitTest1: subjectMark?.unitTest1?.toString() || '',
                    unitTest2: subjectMark?.unitTest2?.toString() || '',
                    final: subjectMark?.final?.toString() || ''
                };
                return acc;
            }, {});
        } else {
            marks = {};
        }

        const studentOptions = students.map(s => `
            <option value="${s.id}" ${selectedStudentId === s.id ? 'selected' : ''}>${s.name} (${s.id})</option>
        `).join('');

        const marksForm = selectedStudentId ? `
            <form id="marks-form" class="space-y-6">
                 <div>
                    <h3 class="text-lg font-medium text-gray-700 mb-4">2. Enter Marks for Each Subject</h3>
                    <div class="space-y-4">
                        ${courses.map(course => `
                            <div class="p-4 border rounded-lg bg-gray-50">
                                <h4 class="font-semibold text-gray-800 mb-3">${course.name} (${course.code})</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label for="${course.code}-ut1" class="block text-sm font-medium text-gray-600">Unit Test 1</label>
                                        <input type="number" data-course="${course.code}" data-type="unitTest1" value="${marks[course.code]?.unitTest1 || ''}" placeholder="Out of 20" min="0" max="20" step="0.5" class="mark-input mt-1 w-full p-2 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label for="${course.code}-ut2" class="block text-sm font-medium text-gray-600">Unit Test 2</label>
                                        <input type="number" data-course="${course.code}" data-type="unitTest2" value="${marks[course.code]?.unitTest2 || ''}" placeholder="Out of 20" min="0" max="20" step="0.5" class="mark-input mt-1 w-full p-2 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label for="${course.code}-final" class="block text-sm font-medium text-gray-600">Final Exam</label>
                                        <input type="number" data-course="${course.code}" data-type="final" value="${marks[course.code]?.final || ''}" placeholder="Out of 80" min="0" max="80" step="1" class="mark-input mt-1 w-full p-2 border border-gray-300 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-300 text-lg">
                    Save All Marks
                </button>
            </form>
        ` : '';

        const content = Card({
            title: "Enter Student Marks",
            children: `
                <div class="max-w-4xl mx-auto p-4">
                    <div class="mb-6">
                        <label for="student-select" class="block text-lg font-medium text-gray-700 mb-2">1. Select Student</label>
                        <select id="student-select" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg">
                            <option value="">-- Select a student --</option>
                            ${studentOptions}
                        </select>
                    </div>
                    ${marksForm}
                </div>
            `
        });

        rootElement.innerHTML = content;
        attachEventListeners();
    };
    
    const attachEventListeners = () => {
        document.getElementById('student-select').addEventListener('change', (e) => {
            selectedStudentId = e.target.value;
            render();
        });

        if (selectedStudentId) {
            document.getElementById('marks-form').addEventListener('submit', (e) => {
                e.preventDefault();

                const parsedMarks = {};
                let hasError = false;

                const inputs = document.querySelectorAll('.mark-input');
                inputs.forEach(input => {
                    const courseCode = input.dataset.course;
                    const markType = input.dataset.type;
                    const value = input.value;

                    if (value !== '') {
                        const numValue = parseFloat(value);
                        let max = 0;
                        if(markType === 'unitTest1' || markType === 'unitTest2') max = 20;
                        else if (markType === 'final') max = 80;
                        
                        if(isNaN(numValue) || numValue < 0 || numValue > max) {
                            alert(`Invalid mark for ${markType} in ${courseCode}. Must be between 0 and ${max}.`);
                            hasError = true;
                            return;
                        }

                        if (!parsedMarks[courseCode]) parsedMarks[courseCode] = {};
                        parsedMarks[courseCode][markType] = numValue;
                    }
                });

                if (!hasError) {
                    onSaveAllMarks(selectedStudentId, parsedMarks);
                }
            });
        }
    };

    render();
}
