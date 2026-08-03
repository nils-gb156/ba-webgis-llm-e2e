// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    await expect(infoPanelToggle).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        return highlightedCoordinate === undefined;
    }).toBe(true);

    await page.getByTestId('map-container').click({
        position: { x: 700, y: 400 }
    });

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        return highlightedCoordinate?.length ?? 0;
    }).toBe(2);

    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).not.toBeVisible();

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 1) {
            return rowCount - 1;
        }

        return await weatherForecastSection.evaluate((section) => {
            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) {
                return listItems;
            }

            const tableRows = section.querySelectorAll('tr').length;
            if (tableRows > 1) {
                return tableRows - 1;
            }

            return section.querySelectorAll('img').length;
        });
    }).toBe(24);
});
