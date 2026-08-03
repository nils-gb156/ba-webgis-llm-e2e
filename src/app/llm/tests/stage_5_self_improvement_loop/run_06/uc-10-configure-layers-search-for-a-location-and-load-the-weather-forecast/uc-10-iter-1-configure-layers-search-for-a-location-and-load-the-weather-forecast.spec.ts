// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByTestId('geocoder-input');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderInput).toBeVisible();

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/M.nster/i);
    await expect(firstResult).toContainText(/Germany/i);

    await firstResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return false;
        }

        const dx = currentCenter[0] - initialCenter[0];
        const dy = currentCenter[1] - initialCenter[1];
        const movedDistance = Math.sqrt(dx * dx + dy * dy);

        const isNearMunster =
            currentCenter[0] > 700000 &&
            currentCenter[0] < 1000000 &&
            currentCenter[1] > 6600000 &&
            currentCenter[1] < 7000000;

        return movedDistance > 50000 && isNearMunster;
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(async () => await weatherForecastSection.innerText()).not.toContain(
        'Click on the map to load a forecast.'
    );

    await expect.poll(async () => {
        const listItems = await weatherForecastSection.getByRole('listitem').count();
        if (listItems > 0) {
            return listItems;
        }

        const rows = await weatherForecastSection.getByRole('row').count();
        if (rows > 0) {
            return rows;
        }

        const articles = await weatherForecastSection.getByRole('article').count();
        if (articles > 0) {
            return articles;
        }

        const text = await weatherForecastSection.innerText();
        return text.match(/\b\d{1,2}:\d{2}\b/g)?.length ?? 0;
    }).toBe(24);
});
