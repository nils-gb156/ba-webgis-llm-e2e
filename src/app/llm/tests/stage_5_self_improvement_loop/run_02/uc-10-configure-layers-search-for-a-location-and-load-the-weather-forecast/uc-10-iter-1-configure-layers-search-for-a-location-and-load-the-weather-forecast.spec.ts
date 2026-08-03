// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.', {
        exact: true
    });

    const countForecastEntries = async () => {
        return await weatherForecastSection.evaluate((section) => {
            const listItemCount = section.querySelectorAll('li').length;
            const text = section.textContent ?? '';
            const timeLabelCount = (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
            return Math.max(listItemCount, timeLabelCount);
        });
    };

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(forecastPlaceholder).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter;
    }).not.toBeUndefined();

    let initialZoom: number | undefined;
    await expect.poll(async () => {
        initialZoom = await getMapZoomLevel(page);
        return initialZoom;
    }).not.toBeUndefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('Münster');

    await firstResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        const currentZoom = await getMapZoomLevel(page);

        if (!initialCenter || initialZoom === undefined || !currentCenter || currentZoom === undefined) {
            return false;
        }

        const distance = Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
        return distance > 50000 || currentZoom > initialZoom;
    }).toBe(true);

    let forecastLoadedFromSelection = true;
    try {
        await expect.poll(countForecastEntries, { timeout: 5000 }).toBe(24);
    } catch {
        forecastLoadedFromSelection = false;
    }

    if (!forecastLoadedFromSelection) {
        const mapBox = await mapContainer.boundingBox();
        expect(mapBox).not.toBeNull();

        await mapContainer.click({
            position: {
                x: Math.round(mapBox!.width * 0.55),
                y: Math.round(mapBox!.height * 0.55)
            }
        });
    }

    await expect(weatherForecastSection).toBeVisible();
    await expect(forecastPlaceholder).toBeHidden();
    await expect.poll(countForecastEntries, { timeout: 15000 }).toBe(24);
});
