// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapZoomLevel
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const mapContainer = page.getByTestId('map-container');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const initialHighlight = await getHighlightedCoordinate(page);
    const initialHighlightKey = initialHighlight ? JSON.stringify(initialHighlight) : undefined;

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        return coordinate ? JSON.stringify(coordinate) : undefined;
    }).not.toBe(initialHighlightKey);

    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeHidden();

    await expect.poll(async () => {
        const roleListItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (roleListItemCount > 0) {
            return roleListItemCount;
        }

        return await weatherForecastSection.evaluate((section) => {
            const ariaListItems = section.querySelectorAll('[role="listitem"]').length;
            if (ariaListItems > 0) {
                return ariaListItems;
            }

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) {
                return listItems;
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) {
                return articles;
            }

            const descendantChildCounts = Array.from(section.querySelectorAll<HTMLElement>('*'))
                .map((element) => element.children.length)
                .filter((count) => count > 0);

            return descendantChildCounts.length > 0 ? Math.max(...descendantChildCounts) : 0;
        });
    }).toBe(24);
});
