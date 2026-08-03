// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();

    const infoPanelVisible = await infoPanel.isVisible();
    const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (!infoPanelVisible && infoPanelPressed !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Weather Forecast');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const previousHighlight = await getHighlightedCoordinate(page);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.58),
            y: Math.round(mapBox!.height * 0.42)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    if (previousHighlight !== undefined) {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(previousHighlight);
    }

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    const countForecastEntries = async (): Promise<number> => {
        return await weatherForecastSection.evaluate((section) => {
            const selectorCounts: Array<[string, number]> = [
                ['[role="listitem"]', section.querySelectorAll('[role="listitem"]').length],
                ['li', section.querySelectorAll('li').length],
                ['time', section.querySelectorAll('time').length],
                ['tbody tr', section.querySelectorAll('tbody tr').length],
                ['[role="row"]', section.querySelectorAll('[role="row"]').length],
                ['article', section.querySelectorAll('article').length]
            ];

            for (const [selector, count] of selectorCounts) {
                if (count > 0) {
                    if (selector === '[role="row"]') {
                        const headerRows = section.querySelectorAll('[role="row"] [role="columnheader"]').length > 0 ? 1 : 0;
                        return count - headerRows;
                    }
                    return count;
                }
            }

            const text = section.textContent ?? '';
            const timeMatches = text.match(/\b\d{1,2}:\d{2}\b/g);
            if (timeMatches && timeMatches.length > 0) {
                return timeMatches.length;
            }

            return 0;
        });
    };

    await expect.poll(countForecastEntries).toBe(24);
});
