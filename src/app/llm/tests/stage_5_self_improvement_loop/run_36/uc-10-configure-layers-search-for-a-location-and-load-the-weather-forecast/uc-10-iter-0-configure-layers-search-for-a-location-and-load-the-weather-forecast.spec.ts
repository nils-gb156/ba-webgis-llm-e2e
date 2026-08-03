// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderTextbox = page.getByRole('textbox', {
        name: 'Geocoder search',
        exact: true
    });
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
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderTextbox).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('The map center was not available after the application loaded.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderTextbox.click();
    await geocoderTextbox.fill('Münster');

    const resultOptions = page.getByRole('option').filter({ hasText: /Münster/i });
    const resultButtons = page.getByRole('button', { name: /Münster/i });
    const resultListItems = page.getByRole('listitem').filter({ hasText: /Münster/i });
    const resultTexts = page.getByText(/Münster/i);

    await expect
        .poll(async () => {
            const optionCount = await resultOptions.count();
            if (optionCount > 0) return optionCount;

            const buttonCount = await resultButtons.count();
            if (buttonCount > 0) return buttonCount;

            const listItemCount = await resultListItems.count();
            if (listItemCount > 0) return listItemCount;

            return await resultTexts.count();
        })
        .toBeGreaterThan(0);

    if ((await resultOptions.count()) > 0) {
        await resultOptions.first().click();
    } else if ((await resultButtons.count()) > 0) {
        await resultButtons.first().click();
    } else if ((await resultListItems.count()) > 0) {
        await resultListItems.first().click();
    } else {
        await resultTexts.first().click();
    }

    await expect(geocoderTextbox).toHaveValue(/Münster/i);

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            if (!currentCenter) {
                return false;
            }

            const delta = Math.hypot(
                currentCenter[0] - initialCenter[0],
                currentCenter[1] - initialCenter[1]
            );
            return delta > 10000;
        })
        .toBe(true);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect
        .poll(async () => {
            const listItemCount = await weatherForecastSection.getByRole('listitem').count();
            if (listItemCount > 0) {
                return listItemCount;
            }

            const rowCount = await weatherForecastSection.getByRole('row').count();
            if (rowCount > 0) {
                const columnHeaderCount =
                    await weatherForecastSection.getByRole('columnheader').count();
                return columnHeaderCount > 0 ? rowCount - 1 : rowCount;
            }

            return await weatherForecastSection.evaluate((node) => {
                return node.querySelectorAll('li').length;
            });
        })
        .toBe(24);
});
