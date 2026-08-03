// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).toContainText('Weather Forecast');
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect
        .poll(() =>
            weatherForecastSection.evaluate((section) => {
                const normalizedText = section.textContent?.replace(/\s+/g, ' ').trim() ?? '';
                const timeMatches = normalizedText.match(/\b\d{1,2}:\d{2}\b/g) ?? [];
                const uniqueTimes = new Set(timeMatches).size;
                if (uniqueTimes === 24) {
                    return 24;
                }

                const listItems = section.querySelectorAll('li,[role="listitem"]').length;
                if (listItems === 24) {
                    return 24;
                }

                const tableBodyRows = section.querySelectorAll('tbody tr').length;
                if (tableBodyRows === 24) {
                    return 24;
                }

                const rowsIncludingHeader = section.querySelectorAll('tr,[role="row"]').length;
                if (rowsIncludingHeader - 1 === 24) {
                    return 24;
                }

                const buttons = section.querySelectorAll('button').length;
                if (buttons === 24) {
                    return 24;
                }

                const containers = [section, ...Array.from(section.querySelectorAll('*'))];
                for (const container of containers) {
                    const children = Array.from(container.children);
                    if (children.length !== 24) {
                        continue;
                    }

                    const informativeChildren = children.filter((child) => {
                        const text = child.textContent?.replace(/\s+/g, ' ').trim() ?? '';
                        return text.length > 0 || child.querySelector('img,svg,canvas') !== null;
                    }).length;

                    if (informativeChildren >= 20) {
                        return 24;
                    }
                }

                return Math.max(
                    uniqueTimes,
                    listItems,
                    tableBodyRows,
                    Math.max(0, rowsIncludingHeader - 1),
                    buttons
                );
            })
        )
        .toBe(24);
});
