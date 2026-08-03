// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const forecastSection = page.getByTestId('weather-forecast-section');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(forecastSection).toBeVisible();
    await expect(forecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(forecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.58),
            y: Math.round(mapBox.height * 0.47)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    await expect.poll(async () => {
        const text = (await forecastSection.textContent()) ?? '';
        return text.includes('Click on the map to load a forecast.');
    }).toBe(false);

    await expect.poll(async () => {
        return await forecastSection.evaluate((section) => {
            const text = section.textContent ?? '';
            const candidates = [
                section.querySelectorAll('li').length,
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('time').length,
                section.querySelectorAll('tbody tr').length,
                Math.max(0, section.querySelectorAll('[role="row"]').length - 1),
                (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length
            ];
            return Math.max(...candidates, 0);
        });
    }).toBe(24);
});
