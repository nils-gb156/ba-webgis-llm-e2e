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
    const measurementResult = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(box.width * 0.55), y: Math.round(box.height * 0.35) },
        { x: Math.round(box.width * 0.65), y: Math.round(box.height * 0.42) },
        { x: Math.round(box.width * 0.75), y: Math.round(box.height * 0.5) },
        { x: Math.round(box.width * 0.82), y: Math.round(box.height * 0.58) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResult).toBeVisible();
    await expect(measurementResult).toContainText(/\d+(?:[.,]\d+)?\s*(mm|cm|m|km)\b/i);
});
