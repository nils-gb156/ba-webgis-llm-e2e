// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const forecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(forecastSection).toBeVisible();
    await expect(forecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clickPosition = {
        x: Math.round(mapBox.width * 0.6),
        y: Math.round(mapBox.height * 0.45)
    };

    const forecastResponsePromise = page
        .waitForResponse(
            (response) =>
                response.ok() &&
                /(forecast|weather|locationforecast|met\.no|open-meteo)/i.test(response.url()),
            { timeout: 15000 }
        )
        .catch(() => null);

    await mapContainer.click({ position: clickPosition });

    await forecastResponsePromise;

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        return Array.isArray(highlightedCoordinate) && highlightedCoordinate.length === 2;
    }).toBe(true);

    await expect(forecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await forecastSection.evaluate((section) => {
            const root = section as HTMLElement;

            const roleListItems = root.querySelectorAll('[role="listitem"]');
            if (roleListItems.length > 0) {
                return roleListItems.length;
            }

            const listItems = root.querySelectorAll('li');
            if (listItems.length > 0) {
                return listItems.length;
            }

            const tableBodyRows = root.querySelectorAll('tbody tr');
            if (tableBodyRows.length > 0) {
                return tableBodyRows.length;
            }

            const roleRows = root.querySelectorAll('[role="row"]');
            if (roleRows.length > 0) {
                const hasColumnHeaders = root.querySelectorAll('[role="columnheader"]').length > 0;
                return hasColumnHeaders ? Math.max(roleRows.length - 1, 0) : roleRows.length;
            }

            const tableRows = root.querySelectorAll('tr');
            if (tableRows.length > 0) {
                const headerRows = root.querySelectorAll('thead tr').length;
                return Math.max(tableRows.length - headerRows, 0);
            }

            const articles = root.querySelectorAll('article');
            if (articles.length > 0) {
                return articles.length;
            }

            const timeElements = root.querySelectorAll('time');
            if (timeElements.length > 0) {
                return timeElements.length;
            }

            const descendants = Array.from(root.querySelectorAll('*')) as HTMLElement[];
            const containerWith24Children = descendants.find((element) => element.children.length === 24);
            return containerWith24Children ? containerWith24Children.children.length : 0;
        });
    }).toBe(24);
});
