
import { Card } from '../../components/ui/Card.js';

export function renderReports(rootElement) {
    const content = Card({
        title: "Reports & Analytics",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section is for generating and viewing various reports, such as student attendance, academic performance, and placement statistics.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
