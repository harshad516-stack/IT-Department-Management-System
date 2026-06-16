import { Card } from '../../components/ui/Card.js';
import { UserRole } from '../../types.js';

const ChartBarIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`;
const UsersIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197m0 0A4 4 0 119.646 3.646 4 4 0 0112 4.354z" /></svg>`;
const AcademicCapIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20" /></svg>`;

const StatCard = ({ title, value, icon, color }) => Card({
    className: "flex items-center p-4",
    children: `
        <div class="p-3 rounded-full mr-4 ${color}">
            ${icon}
        </div>
        <div>
            <p class="text-sm text-gray-500 font-medium">${title}</p>
            <p class="text-2xl font-bold text-gray-800">${value}</p>
        </div>
    `
});

export function renderDashboard(rootElement, { user, setActiveComponent, students, faculty, courses }) {
    let quickLinksCard = '';

    if (user.role !== UserRole.Student) { // Only for HOD and Faculty
        const quickLinksHTML = `
            <button data-component="StudentManagement" class="quick-link p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-center transition-colors">Manage Students</button>
            <button data-component="AcademicManagement" class="quick-link p-4 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg text-center transition-colors">Manage Courses</button>
            <button data-component="FinalMarks" class="quick-link p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold rounded-lg text-center transition-colors">Manage Marks</button>
        `;
        quickLinksCard = `
            <div class="grid grid-cols-1 gap-6">
                ${Card({ title: "Quick Links", children: `
                     <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        ${quickLinksHTML}
                     </div>
                `})}
            </div>
        `;
    }

    const content = `
        <div class="space-y-6">
            <h2 class="text-3xl font-bold text-gray-800">Department Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${StatCard({ title: "Total Students", value: students.length, icon: UsersIcon(), color: "bg-blue-100 text-blue-600" })}
                ${StatCard({ title: "Total Faculty", value: faculty.length, icon: AcademicCapIcon(), color: "bg-green-100 text-green-600" })}
                ${StatCard({ title: "Courses Offered", value: courses.length, icon: ChartBarIcon(), color: "bg-yellow-100 text-yellow-600" })}
            </div>
            ${quickLinksCard}
        </div>
    `;

    rootElement.innerHTML = content;

    rootElement.querySelectorAll('.quick-link').forEach(button => {
        button.addEventListener('click', () => {
            setActiveComponent(button.dataset.component);
        });
    });
}