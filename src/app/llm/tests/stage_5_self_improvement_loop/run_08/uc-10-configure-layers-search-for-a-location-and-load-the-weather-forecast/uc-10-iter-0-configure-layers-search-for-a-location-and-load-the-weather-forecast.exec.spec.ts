// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const forecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(forecastSection).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').toBe(
        'false'
    );

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = page.getByRole('option').first();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText(/Münster/i);
    await firstSearchResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) {
            return 0;
        }
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(10000);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!center || !highlightedCoordinate) {
            return Number.POSITIVE_INFINITY;
        }
        return Math.hypot(
            center[0] - highlightedCoordinate[0],
            center[1] - highlightedCoordinate[1]
        );
    }).toBeLessThan(50000);

    await expect(
        forecastSection.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeHidden();

    await expect.poll(async () => await forecastSection.getByRole('listitem').count()).toBe(24);
});
