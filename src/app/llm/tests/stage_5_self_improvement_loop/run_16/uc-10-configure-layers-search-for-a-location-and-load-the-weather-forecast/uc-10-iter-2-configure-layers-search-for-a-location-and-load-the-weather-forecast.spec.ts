// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderResults = page.getByTestId('geocoder-results');
    const firstGeocoderResult = page.getByTestId('geocoder-result-item-0');
    const forecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const centerBeforeSearch = await expect
        .poll(() => getMapCenter(page))
        .not.toBeUndefined()
        .then(async () => (await getMapCenter(page)) as [number, number]);

    const zoomBeforeSearch = await expect
        .poll(() => getMapZoomLevel(page))
        .not.toBeUndefined()
        .then(async () => (await getMapZoomLevel(page)) as number);

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue('Münster');

    await expect(geocoderResults).toBeVisible();
    await expect(firstGeocoderResult).toBeVisible();
    await expect(firstGeocoderResult).toContainText(/Münster/i);

    await firstGeocoderResult.click();

    await expect(geocoderResults).not.toBeVisible();

    await expect
        .poll(
            async () => {
                const centerAfterSearch = await getMapCenter(page);
                if (!centerAfterSearch) {
                    return 0;
                }

                return Math.hypot(
                    centerAfterSearch[0] - centerBeforeSearch[0],
                    centerAfterSearch[1] - centerBeforeSearch[1]
                );
            },
            { timeout: 20000 }
        )
        .toBeGreaterThan(10000);

    await expect
        .poll(
            async () => {
                const zoomAfterSearch = await getMapZoomLevel(page);
                return typeof zoomAfterSearch === 'number' ? zoomAfterSearch : -1;
            },
            { timeout: 20000 }
        )
        .toBeGreaterThan(zoomBeforeSearch);

    await expect(forecastSection).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).not.toBeVisible();

    await expect
        .poll(
            async () =>
                await forecastSection.evaluate((section) => {
                    const roleListItems = section.querySelectorAll('[role="listitem"]').length;
                    if (roleListItems > 0) return roleListItems;

                    const listItems = section.querySelectorAll('li').length;
                    if (listItems > 0) return listItems;

                    const roleRows = section.querySelectorAll('[role="row"]').length;
                    if (roleRows > 0) return roleRows;

                    const tableRows = section.querySelectorAll('tr').length;
                    if (tableRows > 0) return tableRows;

                    const timeLikeElements = Array.from(section.querySelectorAll('*')).filter((element) => {
                        const text = element.textContent?.trim() ?? '';
                        return /^([01]?\d|2[0-3]):\d{2}$/.test(text) || /^(1[0-2]|0?\d)\s?(AM|PM)$/i.test(text);
                    });
                    if (timeLikeElements.length > 0) return timeLikeElements.length;

                    return Array.from(section.children).filter((element) => {
                        const text = element.textContent?.trim() ?? '';
                        return (
                            text.length > 0 &&
                            !/weather forecast/i.test(text) &&
                            !/click on the map to load a forecast/i.test(text)
                        );
                    }).length;
                }),
            { timeout: 20000 }
        )
        .toBe(24);
});
