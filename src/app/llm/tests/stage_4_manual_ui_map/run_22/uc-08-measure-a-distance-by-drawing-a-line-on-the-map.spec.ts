// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(mapBox.width * 0.35), y: Math.round(mapBox.height * 0.72) },
        { x: Math.round(mapBox.width * 0.45), y: Math.round(mapBox.height * 0.62) },
        { x: Math.round(mapBox.width * 0.55), y: Math.round(mapBox.height * 0.68) },
        { x: Math.round(mapBox.width * 0.65), y: Math.round(mapBox.height * 0.56) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect.poll(async () => {
        const text = (await measurementPanel.textContent()) ?? '';
        return text.replace(/\s+/g, ' ').trim();
    }).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
