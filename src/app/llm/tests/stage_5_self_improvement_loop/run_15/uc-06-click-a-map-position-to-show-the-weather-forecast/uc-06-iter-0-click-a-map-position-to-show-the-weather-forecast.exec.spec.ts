// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const placeholderText = weatherForecastSection.getByText('Click on the map to load a forecast.', {
        exact: true
    });

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(placeholderText).toBeVisible();

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    await mapContainer.click({
        position: { x: 700, y: 320 }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
    await expect(weatherForecastSection).toBeVisible();
    await expect(placeholderText).not.toBeVisible();

    const getForecastEntryCount = async (): Promise<number> => {
        const listItems = await weatherForecastSection.getByRole('listitem').count();
        if (listItems > 0) {
            return listItems;
        }

        const rows = await weatherForecastSection.getByRole('row').count();
        if (rows > 1) {
            return rows - 1;
        }

        const articles = await weatherForecastSection.getByRole('article').count();
        if (articles > 0) {
            return articles;
        }

        const images = await weatherForecastSection.getByRole('img').count();
        if (images > 0) {
            return images;
        }

        const fallbackListItems = await weatherForecastSection.locator('li').count();
        if (fallbackListItems > 0) {
            return fallbackListItems;
        }

        const fallbackRows = await weatherForecastSection.locator('tr').count();
        if (fallbackRows > 1) {
            return fallbackRows - 1;
        }

        return 0;
    };

    await expect.poll(getForecastEntryCount).toBe(24);
});
