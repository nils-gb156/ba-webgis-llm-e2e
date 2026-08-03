// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let centerBeforeSelection: [number, number] | undefined;
    await expect.poll(async () => {
        centerBeforeSelection = await getMapCenter(page);
        return centerBeforeSelection;
    }).toBeDefined();

    if (!centerBeforeSelection) {
        throw new Error('Map center was not available before selecting the geocoder result.');
    }

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const munsterPattern = /M[üu]nster/i;
    const optionResults = page.getByRole('option', { name: munsterPattern });
    const buttonResults = page.getByRole('button', { name: munsterPattern });
    const linkResults = page.getByRole('link', { name: munsterPattern });
    const listItemResults = page.getByRole('listitem').filter({ hasText: munsterPattern });

    await expect.poll(async () => {
        const counts = [
            await optionResults.count(),
            await buttonResults.count(),
            await linkResults.count(),
            await listItemResults.count()
        ];
        return Math.max(...counts);
    }).toBeGreaterThan(0);

    if ((await optionResults.count()) > 0) {
        const firstResult = optionResults.first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();
    } else if ((await buttonResults.count()) > 0) {
        const firstResult = buttonResults.first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();
    } else if ((await linkResults.count()) > 0) {
        const firstResult = linkResults.first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();
    } else if ((await listItemResults.count()) > 0) {
        const firstResult = listItemResults.first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();
    } else {
        throw new Error('No geocoder result for "Münster" appeared.');
    }

    await expect.poll(async () => {
        const centerAfterSelection = await getMapCenter(page);
        if (!centerAfterSelection) {
            return 0;
        }

        return Math.hypot(
            centerAfterSelection[0] - centerBeforeSelection[0],
            centerAfterSelection[1] - centerBeforeSelection[1]
        );
    }).toBeGreaterThan(1000);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const candidateCounts = [
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('li').length,
                section.querySelectorAll('tbody > tr').length,
                section.querySelectorAll('article').length,
                section.querySelectorAll('img').length
            ];

            if (candidateCounts.includes(24)) {
                return true;
            }

            const descendants = [section, ...Array.from(section.querySelectorAll('*'))];
            return descendants.some((element) => element.children.length === 24);
        });
    }).toBe(true);
});
