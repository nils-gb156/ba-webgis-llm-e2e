// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
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

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstSearchResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstSearchResult).toBeVisible();
    await expect(firstSearchResult).toContainText('Münster');
    await firstSearchResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        const highlightedCoordinate = await getHighlightedCoordinate(page);

        if (!currentCenter || !highlightedCoordinate || !initialCenter) {
            return false;
        }

        const movedDistance = Math.hypot(
            currentCenter[0] - initialCenter[0],
            currentCenter[1] - initialCenter[1]
        );
        const centerToHighlightDistance = Math.hypot(
            currentCenter[0] - highlightedCoordinate[0],
            currentCenter[1] - highlightedCoordinate[1]
        );

        return movedDistance > 50000 && centerToHighlightDistance < 300000;
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 0) {
            return rowCount;
        }

        return await weatherForecastSection.evaluate((section) => {
            const elements = [section, ...Array.from(section.querySelectorAll('*'))];
            let maxChildCount = 0;

            for (const element of elements) {
                maxChildCount = Math.max(maxChildCount, element.children.length);
            }

            return maxChildCount;
        });
    }).toBe(24);
});
