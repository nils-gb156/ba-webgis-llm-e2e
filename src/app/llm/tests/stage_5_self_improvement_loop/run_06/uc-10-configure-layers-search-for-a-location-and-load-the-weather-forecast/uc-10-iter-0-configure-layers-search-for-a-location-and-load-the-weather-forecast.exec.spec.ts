// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(page.getByTestId('geocoder-input')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderPanel = page.getByTestId('geocoder-panel');
    const firstGeocoderResult = geocoderPanel.locator('[role="option"], button, a, li').first();

    await expect(firstGeocoderResult).toBeVisible();
    await expect(firstGeocoderResult).toContainText(/Münster/i);
    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return false;
        }
        return (
            Math.abs(currentCenter[0] - initialCenter[0]) > 1000 ||
            Math.abs(currentCenter[1] - initialCenter[1]) > 1000
        );
    }).toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(async () => {
        const text = await weatherForecastSection.innerText();
        return [
            await weatherForecastSection.getByRole('listitem').count(),
            await weatherForecastSection.getByRole('row').count(),
            await weatherForecastSection.getByRole('article').count(),
            await weatherForecastSection.getByRole('img').count(),
            text.match(/\b\d{1,2}:\d{2}\b/g)?.length ?? 0
        ];
    }).toContain(24);
});
