// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(forecastPlaceholder).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
    await expect.poll(async () => (await getMapCenter(page))?.length).toBe(2);

    const highlightedCoordinateBeforeClick = await getHighlightedCoordinate(page);
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.55),
            y: Math.round(mapBox!.height * 0.5)
        }
    });

    if (highlightedCoordinateBeforeClick) {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(highlightedCoordinateBeforeClick);
    } else {
        await expect.poll(async () => (await getHighlightedCoordinate(page))?.length).toBe(2);
    }

    await expect(weatherForecastSection).toBeVisible();
    await expect(forecastPlaceholder).not.toBeVisible();

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((node) => {
            const root = node as HTMLElement;

            const timeMatches = root.innerText.match(/\b\d{1,2}:\d{2}\b/g) ?? [];
            if (timeMatches.length > 0) {
                return timeMatches.length;
            }

            const listItems = root.querySelectorAll('li, [role="listitem"]').length;
            if (listItems > 0) {
                return listItems;
            }

            const rows = root.querySelectorAll('tr, [role="row"]').length;
            if (rows > 0) {
                const hasHeader = root.querySelectorAll('th, [role="columnheader"]').length > 0;
                return hasHeader ? rows - 1 : rows;
            }

            const candidateChildren = Array.from(root.children).filter((child) => {
                const tag = child.tagName.toLowerCase();
                const text = child.textContent?.trim() ?? '';
                return !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) && text !== 'Click on the map to load a forecast.';
            });

            return candidateChildren.length;
        });
    }).toBe(24);
});
