// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const measurementPanel = page.getByTestId('measurement-panel');
    if (!(await measurementPanel.isVisible())) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const positions = [
        { x: Math.round(box.width * 0.25), y: Math.round(box.height * 0.35) },
        { x: Math.round(box.width * 0.4), y: Math.round(box.height * 0.42) },
        { x: Math.round(box.width * 0.58), y: Math.round(box.height * 0.5) },
        { x: Math.round(box.width * 0.72), y: Math.round(box.height * 0.58) }
    ];

    await mapContainer.click({ position: positions[0] });
    await mapContainer.click({ position: positions[1] });
    await mapContainer.click({ position: positions[2] });
    await mapContainer.dblclick({ position: positions[3] });

    const measurement = measurementPanel.getByTestId('measurement');
    await expect(measurement).toBeVisible();
    await expect(measurement).toContainText(/\d[\d.,]*\s*(m|km)\b/);
});
