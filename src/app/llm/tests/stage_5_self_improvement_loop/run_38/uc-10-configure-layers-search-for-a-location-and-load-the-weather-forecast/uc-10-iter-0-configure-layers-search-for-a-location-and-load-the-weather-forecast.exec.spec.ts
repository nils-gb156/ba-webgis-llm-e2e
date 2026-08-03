// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const geocoderPanel = page.getByTestId('geocoder-panel');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application startup.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderInput = geocoderPanel.getByRole('textbox', { name: 'Geocoder search', exact: true });
    await expect(geocoderInput).toBeVisible();
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByRole('option').filter({ hasText: /Münster/i }).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return false;
        }

        const dx = Math.abs(currentCenter[0] - initialCenter[0]);
        const dy = Math.abs(currentCenter[1] - initialCenter[1]);
        return dx > 10000 || dy > 10000;
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const tbodyRows = section.querySelectorAll('tbody tr').length;
            if (tbodyRows > 0) return tbodyRows;

            const roleListItems = section.querySelectorAll('[role="listitem"]').length;
            if (roleListItems > 0) return roleListItems;

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) return listItems;

            const rows = section.querySelectorAll('[role="row"]').length;
            if (rows > 0) {
                const hasColumnHeaders = section.querySelectorAll('[role="columnheader"]').length > 0;
                return hasColumnHeaders ? rows - 1 : rows;
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) return articles;

            const repeatedGroup = Array.from(section.querySelectorAll('div, section, ul, ol'))
                .map((element) => element.children.length)
                .find((count) => count === 24);

            return repeatedGroup ?? 0;
        });
    }).toBe(24);
});
