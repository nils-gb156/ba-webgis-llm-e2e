// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const geocoderInput = page.getByTestId('geocoder-input');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
    const temperatureLegend = page.getByTestId('temperature-legend');
    const precipitationLegend = page.getByTestId('precipitation-legend');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
    await expect(temperatureLegend).toBeVisible();
    await expect(precipitationLegend).toBeHidden();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(temperatureLegend).toBeHidden();

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(precipitationLegend).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/Münster/i);

    await firstResult.click();
    await expect(geocoderResults).toBeHidden();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) return false;
        const [x, y] = center;
        return x > 760000 && x < 920000 && y > 6700000 && y < 6900000;
    }, { timeout: 15000 }).toBe(true);

    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');
    await expect(forecastPlaceholder).toBeHidden({ timeout: 15000 });

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const tbodyRowCount = section.querySelectorAll('tbody tr').length;
            if (tbodyRowCount > 0) {
                return tbodyRowCount;
            }

            const allRows = section.querySelectorAll('tr').length;
            if (allRows > 0) {
                const headerRows = section.querySelectorAll('thead tr').length;
                return allRows - headerRows;
            }

            const listItemCount = section.querySelectorAll('[role="listitem"], li').length;
            if (listItemCount > 0) {
                return listItemCount;
            }

            const articleCount = section.querySelectorAll('article').length;
            if (articleCount > 0) {
                return articleCount;
            }

            const directCardCount = Array.from(section.querySelectorAll('div')).filter((element) => {
                const text = element.textContent?.trim() ?? '';
                return text.length > 0 && /(\d{1,2}:\d{2}|°C|mm|m\/s|hPa|%)/.test(text);
            }).length;

            return directCardCount;
        });
    }, { timeout: 15000 }).toBe(24);
});
