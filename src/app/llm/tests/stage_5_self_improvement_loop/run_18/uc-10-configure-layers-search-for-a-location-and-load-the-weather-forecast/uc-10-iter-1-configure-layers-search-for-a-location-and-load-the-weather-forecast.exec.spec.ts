// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
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
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return Array.isArray(center) && center.length === 2;
    }).toBe(true);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

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

    const optionResults = geocoderPanel.getByRole('option', { name: /Münster/i });
    const buttonResults = geocoderPanel.getByRole('button', { name: /Münster/i });
    const linkResults = geocoderPanel.getByRole('link', { name: /Münster/i });
    const listItemResults = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i });

    await expect.poll(async () => {
        const optionCount = await optionResults.count();
        const buttonCount = await buttonResults.count();
        const linkCount = await linkResults.count();
        const listItemCount = await listItemResults.count();
        return optionCount + buttonCount + linkCount + listItemCount;
    }).toBeGreaterThan(0);

    let firstResult = optionResults.first();
    if ((await optionResults.count()) > 0) {
        firstResult = optionResults.first();
    } else if ((await buttonResults.count()) > 0) {
        firstResult = buttonResults.first();
    } else if ((await linkResults.count()) > 0) {
        firstResult = linkResults.first();
    } else {
        firstResult = listItemResults.first();
    }

    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }

        const [x, y] = center;
        const moved =
            Math.abs(x - initialCenter[0]) > 50000 || Math.abs(y - initialCenter[1]) > 50000;
        const inMunsterArea = x > 700000 && x < 1000000 && y > 6600000 && y < 6900000;

        return moved && inMunsterArea;
    }).toBe(true);

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        return (
            !!highlightedCoordinate &&
            highlightedCoordinate[0] > 700000 &&
            highlightedCoordinate[0] < 1000000 &&
            highlightedCoordinate[1] > 6600000 &&
            highlightedCoordinate[1] < 6900000
        );
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByText(/^Location:\s*Münster/i)).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
