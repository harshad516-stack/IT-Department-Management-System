
import { Card } from '../../components/ui/Card.js';

export function renderLibraryResources(rootElement) {
    const content = Card({
        title: "Library Resources",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section will integrate with the library management system to show available books, e-resources, and journals.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
