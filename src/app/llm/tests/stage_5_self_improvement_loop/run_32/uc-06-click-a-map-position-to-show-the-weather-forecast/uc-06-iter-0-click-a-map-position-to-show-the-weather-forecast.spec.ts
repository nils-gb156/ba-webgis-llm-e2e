// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getHighlightedCoordinate
} from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeDefined();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toBeVisible();
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.55),
            y: Math.round(box.height * 0.45)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((el) => {
            const listItems = el.querySelectorAll('li');
            if (listItems.length > 0) {
                return listItems.length;
            }

            const tableRows = el.querySelectorAll('tbody tr');
            if (tableRows.length > 0) {
                return tableRows.length;
            }

            const roleListItems = el.querySelectorAll('[role="listitem"]');
            if (roleListItems.length > 0) {
                return roleListItems.length;
            }

            const bodyRoleRows = el.querySelectorAll('tbody [role="row"]');
            if (bodyRoleRows.length > 0) {
                return bodyRoleRows.length;
            }

            const tableRoleRows = el.querySelectorAll('table [role="row"]');
            if (tableRoleRows.length > 1) {
                return tableRoleRows.length - 1;
            }

            return 0;
        });
    }).toBe(24);
});
