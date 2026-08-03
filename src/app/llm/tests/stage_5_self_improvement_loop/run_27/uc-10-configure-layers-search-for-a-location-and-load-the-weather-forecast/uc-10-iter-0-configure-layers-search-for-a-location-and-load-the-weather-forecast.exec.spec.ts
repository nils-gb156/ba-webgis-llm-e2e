// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

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

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderPanel).toBeVisible();

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderPanel).toContainText(/Münster/i);

    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }

        const [x, y] = center;
        const moved =
            Math.abs(x - initialCenter[0]) > 100000 || Math.abs(y - initialCenter[1]) > 100000;
        const isNearMunster = x > 700000 && x < 1000000 && y > 6600000 && y < 7000000;

        return moved && isNearMunster;
    }).toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        const headerCount = await weatherForecastSection.getByRole('columnheader').count();
        return headerCount > 0 ? rowCount - 1 : rowCount;
    }).toBe(24);
});
