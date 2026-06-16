
import { Card } from '../../components/ui/Card.js';

export function renderLabResources(rootElement) {
    const content = Card({
        title: "Lab Resources",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section will provide details about lab equipment, software availability, and a system for booking lab slots.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
