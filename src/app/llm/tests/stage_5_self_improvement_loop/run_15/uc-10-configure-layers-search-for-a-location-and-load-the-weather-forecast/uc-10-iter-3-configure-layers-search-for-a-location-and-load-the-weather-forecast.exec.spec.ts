// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(temperatureLegend).toBeVisible();
    await expect(precipitationLegend).toBeHidden();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(temperatureLegend).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(precipitationLegend).toBeVisible();

    let centerBeforeSearch: [number, number] | undefined;
    await expect.poll(async () => {
        centerBeforeSearch = await getMapCenter(page);
        return centerBeforeSearch;
    }).not.toBeUndefined();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/Münster/i);

    await firstResult.click();
    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !centerBeforeSearch) {
            return false;
        }

        const [x, y] = center;
        const [initialX, initialY] = centerBeforeSearch;
        const movedDistance = Math.hypot(x - initialX, y - initialY);

        return (
            movedDistance > 10000 &&
            x > 800000 &&
            x < 900000 &&
            y > 6750000 &&
            y < 6850000
        );
    }, { timeout: 15000 }).toBe(true);

    await expect.poll(async () => {
        const coordinate = await getHighlightedCoordinate(page);
        if (!coordinate) {
            return false;
        }

        const [x, y] = coordinate;
        return x > 800000 && x < 900000 && y > 6750000 && y < 6850000;
    }, { timeout: 15000 }).toBe(true);

    await expect(infoPanel).toContainText(/Location:\s*Münster,\s*DE/i, { timeout: 15000 });
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeHidden();
    await expect(weatherForecastSection.getByTestId('weather-forecast')).toBeVisible({ timeout: 15000 });
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24, { timeout: 15000 });
});
