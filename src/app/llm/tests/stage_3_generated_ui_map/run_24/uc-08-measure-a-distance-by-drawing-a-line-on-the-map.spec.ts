// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThanOrEqual(0);

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = { x: Math.round(box.width * 0.58), y: Math.round(box.height * 0.34) };
    const point2 = { x: Math.round(box.width * 0.68), y: Math.round(box.height * 0.42) };
    const point3 = { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.50) };
    const point4 = { x: Math.round(box.width * 0.72), y: Math.round(box.height * 0.62) };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toContainText(/\b\d[\d.,\s]*\s*(m|km)\b/i);
});
