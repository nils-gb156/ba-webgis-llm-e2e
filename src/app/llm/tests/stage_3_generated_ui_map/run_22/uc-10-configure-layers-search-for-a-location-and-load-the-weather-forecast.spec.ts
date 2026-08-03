// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByTestId('geocoder-input')).toBeVisible();
    await expect(page.getByTestId('measurement-panel')).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return Array.isArray(center) && center.length === 2;
        })
        .toBe(true);
    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number';
        })
        .toBe(true);

    const layerSwitcher = page.getByTestId('layer-switcher');
    const temperatureToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationToggle = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    const initialCenter = await getMapCenter(page);
    const initialZoom = await getMapZoomLevel(page);
    if (!initialCenter || initialZoom === undefined) {
        throw new Error('Map state was not available after readiness checks.');
    }

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderInput = page.getByTestId('geocoder-input');
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(page.getByTestId('geocoder-results')).toBeVisible();
    const firstResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect
        .poll(async () => {
            const [currentCenter, currentZoom] = await Promise.all([
                getMapCenter(page),
                getMapZoomLevel(page)
            ]);

            if (!currentCenter || currentZoom === undefined) {
                return false;
            }

            const movedDistance = Math.hypot(
                currentCenter[0] - initialCenter[0],
                currentCenter[1] - initialCenter[1]
            );
            const zoomChanged = Math.abs(currentZoom - initialZoom) >= 1;

            return movedDistance > 100 || zoomChanged;
        })
        .toBe(true);

    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);

    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
});
