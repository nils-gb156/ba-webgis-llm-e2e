// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInputContainer = page.getByTestId('geocoder-input');
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInputContainer).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    await expect(temperatureCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const initialCenter = (await getMapCenter(page))!;

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return false;
        }
        return center[0] !== initialCenter[0] || center[1] !== initialCenter[1];
    }).toBe(true);

    await expect.poll(async () => {
        const highlightedCoordinate = await getHighlightedCoordinate(page);
        if (!highlightedCoordinate) {
            return Number.POSITIVE_INFINITY;
        }

        const muenster3857: [number, number] = [849000, 6793000];
        return Math.hypot(
            highlightedCoordinate[0] - muenster3857[0],
            highlightedCoordinate[1] - muenster3857[1]
        );
    }).toBeLessThan(200000);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    const countForecastEntries = async (): Promise<number> => {
        return await weatherForecastSection.evaluate((section) => {
            const explicitCounts = [
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('li').length,
                section.querySelectorAll('[role="row"]').length,
                section.querySelectorAll('tr').length
            ];
            const explicitCount = Math.max(...explicitCounts);

            if (explicitCount > 0) {
                return explicitCount;
            }

            const allNodes = [section, ...Array.from(section.querySelectorAll('*'))];
            return allNodes.reduce((max, node) => {
                const childCount = Array.from(node.children).filter((child) => {
                    const tag = child.tagName.toLowerCase();
                    return tag !== 'style' && tag !== 'script';
                }).length;
                return Math.max(max, childCount);
            }, 0);
        });
    };

    await expect.poll(countForecastEntries).toBe(24);
});
