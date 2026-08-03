// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const placeholderText = page.getByText('Click on the map to load a forecast.', { exact: true });

    const getForecastEntryCount = async (): Promise<number> => {
        return await page.evaluate(() => {
            const section = document.querySelector('[data-testid="weather-forecast-section"]');
            if (!section) return 0;

            const roleListItems = section.querySelectorAll('[role="listitem"]').length;
            if (roleListItems > 0) return roleListItems;

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) return listItems;

            const tbodyRows = section.querySelectorAll('tbody tr').length;
            if (tbodyRows > 0) return tbodyRows;

            const rowGroups = Array.from(section.querySelectorAll('[role="rowgroup"]'));
            for (const rowGroup of rowGroups) {
                const rows = rowGroup.querySelectorAll('[role="row"]').length;
                if (rows > 0) return rows;
            }

            const roleRows = Array.from(section.querySelectorAll('[role="row"]'));
            if (roleRows.length > 0) {
                const dataRows = roleRows.filter((row) => !row.querySelector('[role="columnheader"]')).length;
                return dataRows > 0 ? dataRows : roleRows.length;
            }

            const images = section.querySelectorAll('img').length;
            if (images === 24) return images;

            let maxChildren = 0;
            const elements = [section, ...Array.from(section.querySelectorAll('*'))];
            for (const element of elements) {
                maxChildren = Math.max(maxChildren, element.children.length);
            }
            return maxChildren;
        });
    };

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    if (await infoPanel.isVisible()) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    } else {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
        await expect(infoPanel).toBeVisible();
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    }

    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(placeholderText).toBeVisible();
    await expect.poll(async () => (await getHighlightedCoordinate(page)) === undefined).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.floor(mapBox.width * 0.5),
            y: Math.floor(mapBox.height * 0.45)
        }
    });

    await expect.poll(async () => Boolean(await getHighlightedCoordinate(page))).toBe(true);
    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(getForecastEntryCount).toBe(24);
});
