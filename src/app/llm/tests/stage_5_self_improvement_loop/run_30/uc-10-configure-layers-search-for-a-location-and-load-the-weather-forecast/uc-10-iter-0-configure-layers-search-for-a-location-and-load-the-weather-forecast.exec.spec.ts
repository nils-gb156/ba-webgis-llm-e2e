// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
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

    await expect(page.getByTestId('geocoder-input')).toBeVisible();
    await expect(page.getByTestId('measurement-toggle')).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    if (await temperatureCheckbox.isChecked()) {
        await temperatureCheckbox.click({ force: true });
    }
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    if (!(await precipitationCheckbox.isChecked())) {
        await precipitationCheckbox.click({ force: true });
    }
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return Array.isArray(center) ? center.length : 0;
    }).toBe(2);
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Initial map center is not available.');
    }

    const geocoderInput = page
        .getByTestId('geocoder-panel')
        .getByRole('textbox', { name: 'Geocoder search', exact: true });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = page.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

    const highlightedCoordinate = await getHighlightedCoordinate(page);
    if (!highlightedCoordinate) {
        throw new Error('Highlighted coordinate is not available after selecting the geocoder result.');
    }

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return Number.POSITIVE_INFINITY;
        }
        const dx = center[0] - highlightedCoordinate[0];
        const dy = center[1] - highlightedCoordinate[1];
        return Math.hypot(dx, dy);
    }).toBeLessThan(250000);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const getForecastEntryCount = async (): Promise<number> =>
        await weatherForecastSection.evaluate((section) => {
            const roleListItems = section.querySelectorAll('[role="listitem"]');
            if (roleListItems.length > 0) {
                return roleListItems.length;
            }

            const listItems = section.querySelectorAll('li');
            if (listItems.length > 0) {
                return listItems.length;
            }

            let maxChildCount = 0;
            const elements = [section, ...Array.from(section.querySelectorAll('*'))];
            for (const element of elements) {
                maxChildCount = Math.max(maxChildCount, element.childElementCount);
            }
            return maxChildCount;
        });

    await expect.poll(async () => await getForecastEntryCount()).toBe(24);
});
