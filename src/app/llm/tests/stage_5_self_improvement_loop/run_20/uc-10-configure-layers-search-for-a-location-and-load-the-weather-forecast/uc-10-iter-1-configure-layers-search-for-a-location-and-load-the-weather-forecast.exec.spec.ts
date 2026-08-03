// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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

    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(page.getByTestId('measurement-toggle')).not.toHaveAttribute('aria-pressed', 'true');

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

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return Array.isArray(center) && center.length === 2;
        })
        .toBe(true);
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

    const optionResults = geocoderPanel.getByRole('option');
    const listItemResults = geocoderPanel.getByRole('listitem');

    await expect
        .poll(
            async () => {
                const optionCount = await optionResults.count();
                const listItemCount = await listItemResults.count();
                return optionCount + listItemCount;
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else {
        await listItemResults.first().click();
    }

    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                const highlight = await getHighlightedCoordinate(page);
                if (!center || !initialCenter || !highlight) {
                    return false;
                }

                const [x, y] = center;
                const [initialX, initialY] = initialCenter;
                const movedDistance = Math.hypot(x - initialX, y - initialY);
                const centerIsNearMunster = x > 600000 && x < 1100000 && y > 6600000 && y < 7000000;

                const [highlightX, highlightY] = highlight;
                const highlightIsNearMunster =
                    highlightX > 600000 &&
                    highlightX < 1100000 &&
                    highlightY > 6600000 &&
                    highlightY < 7000000;

                return movedDistance > 100000 && centerIsNearMunster && highlightIsNearMunster;
            },
            { timeout: 15000 }
        )
        .toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecast = page.getByTestId('weather-forecast');
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecast).toContainText(/Location:\s*Münster/i);
    await expect
        .poll(() => weatherForecastEntries.count(), { timeout: 15000 })
        .toBe(24);
});
