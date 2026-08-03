// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
        await expect(infoPanel).toBeVisible();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).toContainText('Weather Forecast');

    const previousHighlight = await getHighlightedCoordinate(page);

    await expect(mapContainer).toBeVisible();
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.55)
        }
    });

    if (previousHighlight) {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(previousHighlight);
    } else {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    }

    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((node) => {
            const root = node as HTMLElement;
            const candidates = new Set<number>();

            const addCandidates = (container: Element) => {
                candidates.add(container.querySelectorAll('[role="listitem"]').length);
                candidates.add(container.querySelectorAll('li').length);
                candidates.add(container.querySelectorAll('[role="row"]').length);

                for (const table of Array.from(container.querySelectorAll('table'))) {
                    const bodyRows = table.querySelectorAll('tbody tr').length;
                    if (bodyRows > 0) {
                        candidates.add(bodyRows);
                    } else {
                        const rows = Array.from(table.querySelectorAll('tr'));
                        const headerRows = rows.filter((row) => row.querySelector('th')).length;
                        candidates.add(rows.length - headerRows);
                    }
                }

                if (container instanceof HTMLElement) {
                    candidates.add(container.children.length);
                }
            };

            addCandidates(root);

            if (root.children.length === 1) {
                addCandidates(root.children[0]);
            }

            candidates.delete(0);

            if (candidates.has(24)) {
                return 24;
            }

            return candidates.size > 0 ? Math.max(...candidates) : 0;
        });
    }).toBe(24);
});
