import type { Locator } from '@playwright/test';

export async function highlightElements(locator: Locator): Promise<void> {
    await locator.evaluateAll(elements => {
        for (const element of elements) {
            // Animation leaves the element's original inline styles intact.
            element.animate([
                { outline: '3px solid red', outlineOffset: '2px' },
                { outline: '3px solid red', outlineOffset: '2px', offset: 0.8 },
                { outline: '3px solid transparent', outlineOffset: '2px' },
            ], { duration: 1000 });
        }
    });
}
