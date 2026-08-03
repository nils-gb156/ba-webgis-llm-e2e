// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
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
    }
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderInput).toBeVisible();

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(async () => (await getMapCenter(page))?.length ?? 0).toBe(2);
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

    const precipitationLegend = page.getByTestId('precipitation-legend');
    await expect(precipitationLegend).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/Münster/i);

    await firstResult.click();
    await expect(firstResult).toBeHidden();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        const highlightedCoordinate = await getHighlightedCoordinate(page);

        if (!center || !highlightedCoordinate) {
            return false;
        }

        const movedDistance = Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
        const distanceFromCenterToHighlight = Math.hypot(
            center[0] - highlightedCoordinate[0],
            center[1] - highlightedCoordinate[1]
        );

        return movedDistance > 1000 && distanceFromCenterToHighlight < 250000;
    }).toBe(true);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');

    await expect
        .poll(
            async () => {
                const listItemCount = await weatherForecastSection.getByRole('listitem').count();
                if (listItemCount > 0) {
                    return listItemCount;
                }

                const rowCount = await weatherForecastSection.getByRole('row').count();
                const headerCount = await weatherForecastSection.getByRole('columnheader').count();
                if (rowCount > 0) {
                    return headerCount > 0 ? rowCount - 1 : rowCount;
                }

                return 0;
            },
            { timeout: 15000 }
        )
        .toBe(24);
});
