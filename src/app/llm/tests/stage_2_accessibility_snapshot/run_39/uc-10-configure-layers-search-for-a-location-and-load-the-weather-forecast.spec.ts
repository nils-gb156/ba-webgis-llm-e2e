// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    await expect(layerSwitcherToggle).toBeVisible();
    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    await expect(infoPanelToggle).toBeVisible();
    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderInput).toBeVisible();

    const scaleViewer = page.getByTestId('scale-viewer');
    await expect(scaleViewer).toBeVisible();
    const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderPanel).toBeVisible();

    const firstSearchResult = geocoderPanel.getByRole('option').first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => {
        const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
        return currentScaleText !== initialScaleText;
    }).toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    try {
        await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.', { timeout: 10000 });
    } catch {
        const mapContainer = page.getByTestId('map-container');
        await expect(mapContainer).toBeVisible();
        const mapBox = await mapContainer.boundingBox();
        if (!mapBox) {
            throw new Error('Map container has no bounding box.');
        }
        await mapContainer.click({
            position: {
                x: mapBox.width / 2,
                y: mapBox.height / 2
            }
        });
        await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    }

    await expect.poll(async () => {
        const counts = [
            await weatherForecastSection.getByRole('listitem').count(),
            await weatherForecastSection.getByRole('row').count(),
            await weatherForecastSection.locator('article').count(),
            await weatherForecastSection.locator('li').count(),
            await weatherForecastSection.locator('[role="listitem"]').count(),
            await weatherForecastSection.locator('[role="row"]').count()
        ];
        return counts.includes(24) ? 24 : Math.max(0, ...counts);
    }).toBe(24);
});
