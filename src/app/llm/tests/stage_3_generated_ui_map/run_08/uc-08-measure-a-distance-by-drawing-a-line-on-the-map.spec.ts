// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurement = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const measurementTogglePressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementTogglePressed !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const drawPoints = [
        { x: Math.round(box.width * 0.6), y: Math.round(box.height * 0.35) },
        { x: Math.round(box.width * 0.68), y: Math.round(box.height * 0.42) },
        { x: Math.round(box.width * 0.76), y: Math.round(box.height * 0.5) },
        { x: Math.round(box.width * 0.84), y: Math.round(box.height * 0.58) }
    ];

    await mapContainer.click({ position: drawPoints[0] });
    await mapContainer.click({ position: drawPoints[1] });
    await mapContainer.click({ position: drawPoints[2] });
    await mapContainer.dblclick({ position: drawPoints[3] });

    await expect(measurement).toBeVisible();
    await expect(measurement).toContainText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
