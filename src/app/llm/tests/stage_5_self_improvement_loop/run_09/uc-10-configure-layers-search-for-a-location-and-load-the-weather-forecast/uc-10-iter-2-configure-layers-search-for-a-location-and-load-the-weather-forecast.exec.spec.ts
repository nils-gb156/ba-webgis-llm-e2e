// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
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
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderPanel).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Initial map center is not available.');
    }

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

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

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined, { timeout: 15000 }).toBe(true);

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                if (!currentCenter) {
                    return 0;
                }
                return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(1000);

    await expect
        .poll(
            async () => {
                const currentCenter = await getMapCenter(page);
                const highlightedCoordinate = await getHighlightedCoordinate(page);
                if (!currentCenter || !highlightedCoordinate) {
                    return Number.POSITIVE_INFINITY;
                }
                return Math.hypot(
                    currentCenter[0] - highlightedCoordinate[0],
                    currentCenter[1] - highlightedCoordinate[1]
                );
            },
            { timeout: 15000 }
        )
        .toBeLessThan(10000);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText(/Location:\s*Münster/i);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);

    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
