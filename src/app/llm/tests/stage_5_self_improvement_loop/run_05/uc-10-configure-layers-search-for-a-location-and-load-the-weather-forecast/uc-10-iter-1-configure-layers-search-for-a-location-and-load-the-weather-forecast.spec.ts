// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 15000 }).toBe('Carto Light');
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);

    await expect.poll(() => getMapCenter(page), { timeout: 15000 }).not.toBeUndefined();
    await expect.poll(() => getMapZoomLevel(page), { timeout: 15000 }).not.toBeUndefined();

    const initialCenter = await getMapCenter(page);
    const initialZoom = await getMapZoomLevel(page);

    expect(initialCenter).toBeDefined();
    expect(initialZoom).toBeDefined();

    const [initialX, initialY] = initialCenter as [number, number];

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 10000 }).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 10000 }).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/Münster|Munster/i);

    await firstResult.click();

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        const currentZoom = await getMapZoomLevel(page);

        if (!currentCenter || currentZoom === undefined) {
            return false;
        }

        const movedDistance = Math.hypot(currentCenter[0] - initialX, currentCenter[1] - initialY);
        return movedDistance > 1000 || currentZoom > (initialZoom as number);
    }, { timeout: 20000 }).toBe(true);

    const forecastPrompt = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });
    if (await forecastPrompt.isVisible()) {
        const mapBox = await mapContainer.boundingBox();
        if (!mapBox) {
            throw new Error('Map container bounding box is not available.');
        }

        await mapContainer.click({
            position: {
                x: Math.floor(mapBox.width / 2),
                y: Math.floor(mapBox.height / 2)
            }
        });
    }

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const explicitCounts = [
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('li').length,
                section.querySelectorAll('tbody tr').length,
                section.querySelectorAll('article').length
            ].filter((count) => count > 0);

            if (explicitCounts.length > 0) {
                return Math.max(...explicitCounts);
            }

            const nodes = [section, ...Array.from(section.querySelectorAll('*'))];
            let maxSiblingGroup = 0;

            for (const node of nodes) {
                const meaningfulChildren = Array.from(node.children).filter((child) => {
                    const text = child.textContent?.trim() ?? '';
                    if (!text) {
                        return false;
                    }
                    if (/^Weather Forecast$/i.test(text)) {
                        return false;
                    }
                    if (/^Click on the map to load a forecast\.?$/i.test(text)) {
                        return false;
                    }
                    return true;
                });

                maxSiblingGroup = Math.max(maxSiblingGroup, meaningfulChildren.length);
            }

            return maxSiblingGroup;
        });
    }, { timeout: 30000 }).toBe(24);

    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
});
