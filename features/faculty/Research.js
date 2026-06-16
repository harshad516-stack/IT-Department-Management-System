
import { Card } from '../../components/ui/Card.js';

export function renderResearch(rootElement) {
    const content = Card({
        title: "Faculty Research",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section will allow faculty to log their research activities, publications, and ongoing projects.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
