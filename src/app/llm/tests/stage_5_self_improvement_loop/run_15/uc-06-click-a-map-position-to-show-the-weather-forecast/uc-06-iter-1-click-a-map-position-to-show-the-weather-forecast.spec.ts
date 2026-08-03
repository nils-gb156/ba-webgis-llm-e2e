// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('UC-06: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const informationHeading = page.getByRole('heading', { name: 'Information', exact: true });
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });
    const placeholderText = weatherForecastSection.getByText('Click on the map to load a forecast.', {
        exact: true
    });

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(informationHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.55),
            y: Math.round(mapBox!.height * 0.45)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
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
