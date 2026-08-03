// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const forecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(forecastSection).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

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

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            return Array.isArray(coordinate) && coordinate.length === 2;
        })
        .toBe(true);

    await expect(forecastSection).toBeVisible();

    await expect
        .poll(async () => {
            return await forecastSection.evaluate((section) => {
                const listItemsByRole = section.querySelectorAll('[role="listitem"]');
                if (listItemsByRole.length > 0) {
                    return listItemsByRole.length;
                }

                const listItems = section.querySelectorAll('li');
                if (listItems.length > 0) {
                    return listItems.length;
                }

                const tableRows = section.querySelectorAll('tr');
                if (tableRows.length > 1) {
                    return tableRows.length - 1;
                }

                const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
                const textParts: string[] = [];
                let currentNode = walker.nextNode();
                while (currentNode) {
                    const value = currentNode.textContent?.trim();
                    if (value) {
                        textParts.push(value);
                    }
                    currentNode = walker.nextNode();
                }

                const allText = textParts.join('\n');
                const time24hMatches = allText.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
                const unique24hTimes = [...new Set(time24hMatches)];
                if (unique24hTimes.length > 0) {
                    return unique24hTimes.length;
                }

                const time12hMatches = allText.match(/\b(?:1[0-2]|0?\d)(?::[0-5]\d)?\s?(?:AM|PM)\b/gi) ?? [];
                const unique12hTimes = [...new Set(time12hMatches.map((value) => value.toUpperCase()))];
                if (unique12hTimes.length > 0) {
                    return unique12hTimes.length;
                }

                const images = section.querySelectorAll('img');
                if (images.length > 0) {
                    return images.length;
                }

                return 0;
            });
        })
        .toBe(24);
});
