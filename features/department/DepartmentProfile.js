
import { Card } from '../../components/ui/Card.js';

export function renderDepartmentProfile(rootElement) {
    const content = Card({
        title: "Department Profile",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section will display the department's vision, mission, faculty details, lab facilities, and major achievements.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
