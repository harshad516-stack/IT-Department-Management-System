
import { Card } from '../../components/ui/Card.js';

const placementData = [
    { year: '2020', placed: 85, total: 100 },
    { year: '2021', placed: 92, total: 110 },
    { year: '2022', placed: 95, total: 105 },
    { year: '2023', placed: 102, total: 115 },
    { year: '2024', placed: 110, total: 120 },
];

const renderBarChart = (data) => {
    const maxVal = Math.max(...data.map(d => d.total));
    const chartHeight = 200; // in pixels
    const bars = data.map(item => `
        <div class="flex flex-col items-center flex-1">
            <div class="w-full h-[${chartHeight}px] flex items-end justify-center gap-1">
                <div class="bg-blue-300 w-6 rounded-t" title="Total Students: ${item.total}" style="height: ${ (item.total / maxVal) * chartHeight }px;"></div>
                <div class="bg-primary w-6 rounded-t" title="Placed Students: ${item.placed}" style="height: ${ (item.placed / maxVal) * chartHeight }px;"></div>
            </div>
            <span class="text-sm mt-2 text-gray-600">${item.year}</span>
        </div>
    `).join('');

    return `
        <div class="w-full">
            <div class="flex justify-around items-end p-4 border-l border-b border-gray-200">
                ${bars}
            </div>
             <div class="flex justify-center mt-4 space-x-6 text-sm text-gray-700">
                <div class="flex items-center"><div class="w-4 h-4 bg-primary rounded mr-2"></div><span>Students Placed</span></div>
                <div class="flex items-center"><div class="w-4 h-4 bg-blue-300 rounded mr-2"></div><span>Total Students</span></div>
            </div>
        </div>
    `;
};


export function renderAdminDashboard(rootElement, { students, faculty }) {
    const totalUsers = students.length + faculty.length + 3; // Admin, HOD, Staff
    const content = `
        <div class="space-y-6">
            <h2 class="text-3xl font-bold text-gray-800">Administrator Dashboard</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${Card({ className: "bg-blue-50", children: `
                    <h3 class="text-lg font-semibold text-blue-800">Total Users</h3>
                    <p class="text-4xl font-bold text-blue-900">${totalUsers}</p>
                `})}
                ${Card({ className: "bg-green-50", children: `
                    <h3 class="text-lg font-semibold text-green-800">Pending Approvals</h3>
                    <p class="text-4xl font-bold text-green-900">3</p>
                `})}
                ${Card({ className: "bg-yellow-50", children: `
                    <h3 class="text-lg font-semibold text-yellow-800">System Health</h3>
                    <p class="text-4xl font-bold text-yellow-900">Good</p>
                `})}
            </div>
            ${Card({ title: "Placement Statistics", children: renderBarChart(placementData) })}
            ${Card({ title: "Quick Actions", children: `
                <div class="flex flex-wrap gap-4">
                    <button onclick="alert('Navigating to User Management...')" class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800">Manage Users</button>
                    <button onclick="alert('Opening notice broadcast modal...')" class="bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-blue-200">Broadcast Notice</button>
                    <button onclick="alert('Generating system report...')" class="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600">Generate System Report</button>
                </div>
            `})}
        </div>
    `;
    rootElement.innerHTML = content;
}
