// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

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

    const geocoderResultList = geocoderPanel.getByRole('listbox').first();
    await expect(geocoderResultList).toBeVisible();

    const firstGeocoderResult = geocoderResultList.getByRole('option').first();
    await expect(firstGeocoderResult).toBeVisible();
    await firstGeocoderResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center || !initialCenter) {
            return 0;
        }

        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(50000);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const candidateCounts = new Set<number>();

            const tableRows = section.querySelectorAll('tbody tr').length;
            if (tableRows > 0) {
                candidateCounts.add(tableRows);
            }

            const roleRows = Array.from(section.querySelectorAll('[role="row"]')).filter(
                (row) => !row.querySelector('[role="columnheader"]')
            ).length;
            if (roleRows > 0) {
                candidateCounts.add(roleRows);
            }

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) {
                candidateCounts.add(listItems);
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) {
                candidateCounts.add(articles);
            }

            const graphics = section.querySelectorAll('img, svg').length;
            if (graphics > 0) {
                candidateCounts.add(graphics);
            }

            const maxChildGroupSize = Math.max(
                0,
                ...Array.from(section.querySelectorAll('*')).map((element) => element.children.length)
            );
            if (maxChildGroupSize > 0) {
                candidateCounts.add(maxChildGroupSize);
            }

            const timeLabels = (section.textContent?.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
            if (timeLabels > 0) {
                candidateCounts.add(timeLabels);
            }

            return candidateCounts.has(24) ? 24 : 0;
        });
    }).toBe(24);

    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(precipitationCheckbox).toBeChecked();
});
