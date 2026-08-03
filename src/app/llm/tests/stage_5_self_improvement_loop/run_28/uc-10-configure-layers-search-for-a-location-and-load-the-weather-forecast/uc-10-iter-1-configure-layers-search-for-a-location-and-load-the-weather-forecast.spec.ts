// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEnabled();
    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(page.getByText('Click on the map to load a forecast.')).toBeVisible();
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) === 'true').toBe(false);

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();
    if (!initialCenter) {
        throw new Error('Map center was not available after initialization.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/M(?:ü|u)nster/i).first();
    await expect(firstSearchResult).toBeVisible({ timeout: 10000 });
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/M(?:ü|u)nster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        const movedDistance = Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
        return movedDistance > 100_000;
    }, { timeout: 15000 }).toBe(true);

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!highlightedCoordinate) {
            return false;
        }
        const [x, y] = highlightedCoordinate;
        return x > 700_000 && x < 1_100_000 && y > 6_600_000 && y < 7_100_000;
    }, { timeout: 15000 }).toBe(true);

    await expect(page.getByText('Click on the map to load a forecast.')).toBeHidden();
    await expect(infoPanel.getByText(/Location:\s*Münster,\s*DE/i)).toBeVisible({ timeout: 15000 });
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24, { timeout: 15000 });
});
