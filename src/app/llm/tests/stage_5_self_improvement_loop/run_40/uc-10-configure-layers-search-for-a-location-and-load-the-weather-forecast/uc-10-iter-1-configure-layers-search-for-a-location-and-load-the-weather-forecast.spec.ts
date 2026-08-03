// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getHighlightedCoordinate,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    expect(measurementPressed === null || measurementPressed === 'false').toBeTruthy();

    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('precipitation-legend')).toHaveCount(0);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return center !== undefined;
        })
        .toBe(true);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after initial load.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toHaveCount(0);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();

    const resultOption = page.getByRole('option').filter({ hasText: /Münster/i }).first();
    const resultListItem = page.getByRole('listitem').filter({ hasText: /Münster/i }).first();
    const resultButton = page.getByRole('button', { name: /Münster/i }).first();
    const resultText = page.getByText(/Münster/i).first();

    await expect
        .poll(async () => {
            if (await resultOption.isVisible()) return 'option';
            if (await resultButton.isVisible()) return 'button';
            if (await resultListItem.isVisible()) return 'listitem';
            if (await resultText.isVisible()) return 'text';
            return '';
        })
        .not.toBe('');

    const resultKind = await (async () => {
        if (await resultOption.isVisible()) return 'option';
        if (await resultButton.isVisible()) return 'button';
        if (await resultListItem.isVisible()) return 'listitem';
        if (await resultText.isVisible()) return 'text';
        return '';
    })();

    if (resultKind === 'option') {
        await resultOption.click();
    } else if (resultKind === 'button') {
        await resultButton.click();
    } else if (resultKind === 'listitem') {
        await resultListItem.click();
    } else if (resultKind === 'text') {
        await resultText.click();
    } else {
        throw new Error('No selectable geocoder result for "Münster" became visible.');
    }

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect
        .poll(async () => {
            const highlighted = await getHighlightedCoordinate(page);
            return highlighted !== undefined;
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            if (!currentCenter) return 0;
            return Math.hypot(
                currentCenter[0] - initialCenter[0],
                currentCenter[1] - initialCenter[1]
            );
        })
        .toBeGreaterThan(50000);

    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(weatherForecast).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecast).toContainText(/Location:\s*Münster/i);
    await expect(weatherForecastEntries).toHaveCount(24);
});
