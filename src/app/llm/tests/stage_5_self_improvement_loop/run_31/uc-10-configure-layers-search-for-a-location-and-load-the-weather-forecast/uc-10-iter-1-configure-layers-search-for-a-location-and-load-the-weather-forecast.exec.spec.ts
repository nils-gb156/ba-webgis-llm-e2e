// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
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

    const geocoderInput = page.getByTestId('geocoder-input');
    await expect(geocoderInput).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);
    await expect.poll(() => getMapCenter(page), { timeout: 15000 }).not.toBeUndefined();

    const centerBeforeSearch = await expect
        .poll(() => getMapCenter(page), { timeout: 15000 })
        .toBeTruthy()
        .then(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                throw new Error('Map center is not available after the map became ready.');
            }
            return center;
        });

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('Münster');

    await firstResult.click();

    await expect.poll(
        async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return false;
            }
            return center[0] !== centerBeforeSearch[0] || center[1] !== centerBeforeSearch[1];
        },
        { timeout: 30000 }
    ).toBe(true);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 30000 }).not.toBeUndefined();

    await expect.poll(
        async () => {
            const center = await getMapCenter(page);
            const highlight = await getHighlightedCoordinate(page);
            if (!center || !highlight) {
                return Number.POSITIVE_INFINITY;
            }
            return Math.hypot(center[0] - highlight[0], center[1] - highlight[1]);
        },
        { timeout: 30000 }
    ).toBeLessThan(20000);

    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();

    const getForecastEntryCount = async (): Promise<number> => {
        return await page.evaluate(() => {
            const section = document.querySelector('[data-testid="weather-forecast-section"]');
            if (!section) {
                return 0;
            }

            const listItemCount = section.querySelectorAll('[role="listitem"], li').length;
            if (listItemCount > 0) {
                return listItemCount;
            }

            const tableBodyRowCount = section.querySelectorAll('tbody tr').length;
            if (tableBodyRowCount > 0) {
                return tableBodyRowCount;
            }

            const rowCount = section.querySelectorAll('[role="row"], tr').length;
            if (rowCount > 1) {
                return rowCount - 1;
            }

            const articleCount = section.querySelectorAll('article').length;
            if (articleCount > 0) {
                return articleCount;
            }

            return Array.from(section.children).filter((child) => {
                if (/^H[1-6]$/.test(child.tagName)) {
                    return false;
                }
                return (child.textContent ?? '').trim().length > 0;
            }).length;
        });
    };

    let forecastLoaded = false;
    try {
        await expect.poll(() => getForecastEntryCount(), { timeout: 10000 }).toBe(24);
        forecastLoaded = true;
    } catch {
        forecastLoaded = false;
    }

    if (!forecastLoaded) {
        const forecastHint = infoPanel.getByText('Click on the map to load a forecast.', { exact: true });
        await expect(forecastHint).toBeVisible();

        const mapContainer = page.getByTestId('map-container');
        await expect(mapContainer).toBeVisible();

        const box = await mapContainer.boundingBox();
        if (!box) {
            throw new Error('Map container bounding box is not available.');
        }

        await mapContainer.click({
            position: {
                x: Math.round(box.width / 2),
                y: Math.round(box.height / 2)
            }
        });

        await expect.poll(() => getForecastEntryCount(), { timeout: 30000 }).toBe(24);
    }

    await expect(precipitationCheckbox).toBeChecked();
    await expect(temperatureCheckbox).not.toBeChecked();
});
