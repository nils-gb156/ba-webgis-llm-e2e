// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = geocoderPanel.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application startup.');
    }

    const initialZoom = await getMapZoomLevel(page);
    if (initialZoom === undefined) {
        throw new Error('Map zoom level was not available after application startup.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect.poll(async () => {
        const optionCount = await geocoderPanel.getByRole('option').count();
        const resultButtonCount = await geocoderPanel.getByRole('button', { name: /Münster/i }).count();
        return optionCount + resultButtonCount;
    }).toBeGreaterThan(0);

    let firstSearchResult = geocoderPanel.getByRole('option').first();
    if ((await geocoderPanel.getByRole('option').count()) === 0) {
        firstSearchResult = geocoderPanel.getByRole('button', { name: /Münster/i }).first();
    }

    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText(/Münster/i);
    await firstSearchResult.click();

    const initialCenterKey = `${initialCenter[0]},${initialCenter[1]}`;
    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center ? `${center[0]},${center[1]}` : undefined;
    }).not.toBe(initialCenterKey);

    await expect.poll(async () => {
        const zoom = await getMapZoomLevel(page);
        return zoom ?? -1;
    }).toBeGreaterThanOrEqual(initialZoom);

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const roleListItems = section.querySelectorAll('[role="listitem"]').length;
            if (roleListItems > 0) {
                return roleListItems;
            }

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) {
                return listItems;
            }

            const roleRows = section.querySelectorAll('[role="row"]').length;
            if (roleRows > 1) {
                return roleRows - 1;
            }

            const tableRows = section.querySelectorAll('tr').length;
            if (tableRows > 1) {
                return tableRows - 1;
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) {
                return articles;
            }

            return 0;
        });
    }).toBe(24);
});
