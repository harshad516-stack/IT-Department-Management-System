import { Card } from '../../components/ui/Card.js';

export function renderAttendance(rootElement, { user, students, courses }) {

    const currentUserStudent = students.find(s => s.name === user.name);

    if (!currentUserStudent || !currentUserStudent.subjectAttendance || Object.keys(currentUserStudent.subjectAttendance).length === 0) {
        rootElement.innerHTML = Card({
            title: "My Attendance",
            children: `
                <div class="text-center text-gray-500 py-8">
                    <h2 class="text-2xl font-semibold mb-2">Attendance Not Available</h2>
                    <p>Your attendance records have not been published yet. Please check back later.</p>
                </div>
            `
        });
        return;
    }

    const courseMap = new Map(courses.map(c => [c.code, c.name]));
    
    // Calculate Overall Attendance
    let totalAttended = 0;
    let totalConducted = 0;
    Object.values(currentUserStudent.subjectAttendance).forEach(att => {
        totalAttended += att.attended;
        totalConducted += att.total;
    });
    const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;

    const getAttendanceColor = (percentage) => {
        if (percentage >= 75) return { text: 'text-green-600', bg: 'bg-green-500', track: 'stroke-green-600', background: 'stroke-green-100' };
        if (percentage >= 50) return { text: 'text-yellow-600', bg: 'bg-yellow-500', track: 'stroke-yellow-500', background: 'stroke-yellow-100' };
        return { text: 'text-red-600', bg: 'bg-red-500', track: 'stroke-red-500', background: 'stroke-red-100' };
    };

    const overallColor = getAttendanceColor(overallPercentage);
    const circumference = 2 * Math.PI * 50; // a circle with radius 50
    const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

    const circularProgressBar = `
        <div class="relative w-48 h-48">
            <svg class="w-full h-full" viewBox="0 0 120 120">
                <circle class="stroke-current ${overallColor.background}" cx="60" cy="60" r="50" stroke-width="12" fill="transparent"></circle>
                <circle
                    class="stroke-current ${overallColor.track} transition-all duration-1000 ease-out"
                    cx="60" cy="60" r="50" stroke-width="12" fill="transparent"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${circumference}"
                    transform="rotate(-90 60 60)"
                    style="stroke-dashoffset: ${strokeDashoffset}; stroke-linecap: round;"
                ></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-bold ${overallColor.text}">${overallPercentage}%</span>
                <span class="text-sm text-gray-500">Overall</span>
            </div>
        </div>
    `;

    const subjectBreakdown = Object.entries(currentUserStudent.subjectAttendance).map(([code, attendance]) => {
        const percentage = attendance.total > 0 ? Math.round((attendance.attended / attendance.total) * 100) : 0;
        const color = getAttendanceColor(percentage);
        
        return `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-gray-800">${courseMap.get(code) || code}</h4>
                    <span class="font-semibold ${color.text}">${percentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="${color.bg} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <p class="text-right text-sm text-gray-500 mt-1">Attended: ${attendance.attended} / ${attendance.total}</p>
            </div>
        `;
    }).join('');

    const content = Card({
        title: "My Attendance",
        children: `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-1 flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-inner">
                    ${circularProgressBar}
                    <div class="text-center mt-4">
                         <p class="text-lg font-semibold text-gray-700">Total Classes</p>
                         <p class="text-2xl font-bold">${totalAttended} / ${totalConducted}</p>
                    </div>
                </div>
                <div class="md:col-span-2 space-y-4">
                    <h3 class="text-xl font-semibold text-gray-700 border-b pb-2">Subject-wise Breakdown</h3>
                    ${subjectBreakdown}
                </div>
            </div>
        `
    });
    rootElement.innerHTML = content;
}