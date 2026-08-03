// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    if (!(await infoPanel.isVisible())) {
        const infoPanelToggle = page.getByTestId('info-panel-toggle');
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    await expect(page.getByTestId('geocoder-panel')).toBeVisible();
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

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = (await getMapCenter(page)) as [number, number];

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = geocoderPanel.getByRole('textbox', {
        name: 'Geocoder search',
        exact: true
    });

    await expect(geocoderInput).toBeVisible();
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const optionResults = geocoderPanel.getByRole('option');
    const listItemResults = geocoderPanel.getByRole('listitem');

    await expect
        .poll(async () => {
            const optionCount = await optionResults.count();
            const listItemCount = await listItemResults.count();
            return optionCount + listItemCount;
        })
        .toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else {
        await listItemResults.first().click();
    }

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return false;
            }

            const [x, y] = center;
            const [initialX, initialY] = initialCenter;
            const movedDistance = Math.hypot(x - initialX, y - initialY);
            const isNearMunster = x > 600000 && x < 1100000 && y > 6600000 && y < 7000000;

            return movedDistance > 100000 && isNearMunster;
        })
        .toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect
        .poll(async () => {
            return await weatherForecastSection.getByRole('listitem').count();
        })
        .toBe(24);
});
