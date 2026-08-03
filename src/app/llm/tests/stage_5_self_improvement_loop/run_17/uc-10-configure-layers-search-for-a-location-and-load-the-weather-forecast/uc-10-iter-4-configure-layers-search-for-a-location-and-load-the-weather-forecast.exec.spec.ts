// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcherToggle).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(layerSwitcher).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect(temperatureCheckbox).toBeVisible();
    await expect(precipitationCheckbox).toBeVisible();
    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);

    const initialCenter = await expect
        .poll(() => getMapCenter(page), { timeout: 15000 })
        .not.toBeUndefined()
        .then(async () => await getMapCenter(page));

    if (!initialCenter) {
        throw new Error('Map center was not available after application load.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toHaveCount(0);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue(/M(?:ü|u)nster/i);

    const optionResult = geocoderPanel.getByRole('option', { name: /M(?:ü|u)nster/i }).first();
    const buttonResult = geocoderPanel.getByRole('button', { name: /M(?:ü|u)nster/i }).first();
    const listItemResult = geocoderPanel.getByRole('listitem').filter({ hasText: /M(?:ü|u)nster/i }).first();
    const textResult = geocoderPanel.getByText(/M(?:ü|u)nster/i).first();

    await expect.poll(async () => {
        const optionCount = await optionResult.count();
        const buttonCount = await buttonResult.count();
        const listItemCount = await listItemResult.count();
        const textCount = await textResult.count();
        return optionCount + buttonCount + listItemCount + textCount;
    }, { timeout: 15000 }).toBeGreaterThan(0);

    if (await optionResult.count()) {
        await optionResult.click();
    } else if (await buttonResult.count()) {
        await buttonResult.click();
    } else if (await listItemResult.count()) {
        await listItemResult.click();
    } else if (await textResult.count()) {
        await textResult.click();
    } else {
        await geocoderInput.press('ArrowDown');
        await geocoderInput.press('Enter');
    }

    await expect(geocoderInput).toHaveValue(/M(?:ü|u)nster/i);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 30000 }).not.toBeUndefined();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return 0;
        }
        return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
    }, { timeout: 30000 }).toBeGreaterThan(10000);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        const highlightedCoordinate = await getHighlightedCoordinate(page);

        if (!currentCenter || !highlightedCoordinate) {
            return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(
            currentCenter[0] - highlightedCoordinate[0],
            currentCenter[1] - highlightedCoordinate[1]
        );
    }, { timeout: 30000 }).toBeLessThan(150000);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).toHaveCount(0);
    await expect(infoPanel.getByText(/Location:\s*M(?:ü|u)nster/i)).toBeVisible();
    await expect(weatherForecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);

    await expect(precipitationCheckbox).toBeChecked();
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);
});
