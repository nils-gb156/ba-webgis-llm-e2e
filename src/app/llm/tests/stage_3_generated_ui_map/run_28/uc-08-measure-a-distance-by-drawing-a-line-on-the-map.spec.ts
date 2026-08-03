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

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(mapBox.width * 0.4), y: Math.round(mapBox.height * 0.45) },
        { x: Math.round(mapBox.width * 0.5), y: Math.round(mapBox.height * 0.52) },
        { x: Math.round(mapBox.width * 0.6), y: Math.round(mapBox.height * 0.48) },
        { x: Math.round(mapBox.width * 0.68), y: Math.round(mapBox.height * 0.58) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toContainText(/\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
