// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application startup.');
    }

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

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstSearchResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText(/M(?:ü|u)nster/i);
    await firstSearchResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return 0;
        }
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(1000);

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    const mapSize = await mapContainer.evaluate((element) => ({
        width: element.clientWidth,
        height: element.clientHeight
    }));

    await mapContainer.click({
        position: {
            x: Math.floor(mapSize.width / 2),
            y: Math.floor(mapSize.height / 2)
        }
    });

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

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
