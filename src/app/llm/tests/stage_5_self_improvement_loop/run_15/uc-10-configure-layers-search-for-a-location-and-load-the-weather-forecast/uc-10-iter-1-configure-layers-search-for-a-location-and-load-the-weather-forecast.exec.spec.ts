// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('precipitation-legend')).toBeHidden();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after the map became ready.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const searchResultOptions = page.getByRole('option').filter({ hasText: /m(?:ü|u)nster/i });
    const searchResultButtons = page.getByRole('button').filter({ hasText: /m(?:ü|u)nster/i });
    const searchResultLinks = page.getByRole('link').filter({ hasText: /m(?:ü|u)nster/i });
    const searchResultListItems = page.getByRole('listitem').filter({ hasText: /m(?:ü|u)nster/i });

    await expect.poll(async () => {
        const [optionCount, buttonCount, linkCount, listItemCount] = await Promise.all([
            searchResultOptions.count(),
            searchResultButtons.count(),
            searchResultLinks.count(),
            searchResultListItems.count()
        ]);
        return optionCount + buttonCount + linkCount + listItemCount;
    }, { timeout: 15000 }).toBeGreaterThan(0);

    if ((await searchResultOptions.count()) > 0) {
        await expect(searchResultOptions.first()).toBeVisible();
        await searchResultOptions.first().click();
    } else if ((await searchResultButtons.count()) > 0) {
        await expect(searchResultButtons.first()).toBeVisible();
        await searchResultButtons.first().click();
    } else if ((await searchResultLinks.count()) > 0) {
        await expect(searchResultLinks.first()).toBeVisible();
        await searchResultLinks.first().click();
    } else {
        await geocoderInput.press('ArrowDown');
        await geocoderInput.press('Enter');
    }

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) return 0;
        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }, { timeout: 15000 }).toBeGreaterThan(50000);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) return false;
        const [x, y] = center;
        return x > 760000 && x < 920000 && y > 6700000 && y < 6900000;
    }, { timeout: 15000 }).toBe(true);

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!highlightedCoordinate) return false;
        const [x, y] = highlightedCoordinate;
        return x > 760000 && x < 920000 && y > 6700000 && y < 6900000;
    }, { timeout: 15000 }).toBe(true);

    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');

    if (await forecastPlaceholder.isVisible()) {
        const mapBox = await mapContainer.boundingBox();
        if (!mapBox) {
            throw new Error('Map container has no bounding box.');
        }

        await mapContainer.click({
            position: {
                x: mapBox.width / 2,
                y: mapBox.height / 2
            }
        });
    }

    await expect(forecastPlaceholder).toBeHidden();

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const tbodyRowCount = section.querySelectorAll('tbody tr').length;
            if (tbodyRowCount > 0) {
                return tbodyRowCount;
            }

            const tableRowCount = section.querySelectorAll('tr').length;
            if (tableRowCount > 0) {
                const headerRowCount = section.querySelectorAll('thead tr').length;
                return tableRowCount - headerRowCount;
            }

            const roleRowCount = section.querySelectorAll('[role="row"]').length;
            if (roleRowCount > 0) {
                return roleRowCount;
            }

            const listItemCount = section.querySelectorAll('[role="listitem"], li').length;
            if (listItemCount > 0) {
                return listItemCount;
            }

            const articleCount = section.querySelectorAll('article').length;
            if (articleCount > 0) {
                return articleCount;
            }

            return 0;
        });
    }, { timeout: 15000 }).toBe(24);
});
