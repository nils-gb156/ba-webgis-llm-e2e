// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderInput).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);
    await expect.poll(() => getMapCenter(page), { timeout: 15000 }).not.toBeUndefined();

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    const centerBeforeSearch = await getMapCenter(page);
    expect(centerBeforeSearch).toBeDefined();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderPanel = page.getByTestId('geocoder-panel');
    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible({ timeout: 15000 });
    await firstSearchResult.click();

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 30000 }).not.toBeUndefined();

    await expect.poll(
        async () => {
            const center = await getMapCenter(page);
            if (!center || !centerBeforeSearch) {
                return 0;
            }
            return Math.hypot(center[0] - centerBeforeSearch[0], center[1] - centerBeforeSearch[1]);
        },
        { timeout: 30000 }
    ).toBeGreaterThan(1000);

    await expect.poll(
        async () => {
            const center = await getMapCenter(page);
            const highlight = await getHighlightedCoordinate(page);
            if (!center || !highlight) {
                return Number.POSITIVE_INFINITY;
            }
            return Math.hypot(center[0] - highlight[0], center[1] - highlight[1]);
        },
        { timeout: 30000 }
    ).toBeLessThan(20000);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).toContainText(/Location:\s*Münster/i, { timeout: 30000 });

    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24, { timeout: 30000 });

    await expect(precipitationCheckbox).toBeChecked();
    await expect(temperatureCheckbox).not.toBeChecked();
});
