// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderInput).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Initial map center is not available.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect(page.getByTestId('precipitation-legend')).toBeVisible();
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue(/Münster/i);

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstSearchResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText(/Münster/i);

    await firstSearchResult.click();

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                if (!currentCenter) {
                    return 0;
                }
                return Math.hypot(
                    currentCenter[0] - initialCenter[0],
                    currentCenter[1] - initialCenter[1]
                );
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(50000);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: mapBox.width / 2,
            y: mapBox.height / 2
        }
    });

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    const forecastEntryCount = async () =>
        weatherForecastSection.evaluate((section) => {
            const counts = [
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('li').length,
                section.querySelectorAll('[role="row"]').length,
                section.querySelectorAll('tr').length,
                section.querySelectorAll('article').length
            ];
            return counts.includes(24) ? 24 : Math.max(0, ...counts);
        });

    await expect.poll(forecastEntryCount, { timeout: 15000 }).toBe(24);

    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
