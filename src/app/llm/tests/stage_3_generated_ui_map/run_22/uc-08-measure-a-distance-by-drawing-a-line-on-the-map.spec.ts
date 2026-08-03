// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementResult = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = {
        x: Math.round(box.width * 0.3),
        y: Math.round(box.height * 0.35)
    };
    const point2 = {
        x: Math.round(box.width * 0.45),
        y: Math.round(box.height * 0.4)
    };
    const point3 = {
        x: Math.round(box.width * 0.6),
        y: Math.round(box.height * 0.5)
    };
    const point4 = {
        x: Math.round(box.width * 0.72),
        y: Math.round(box.height * 0.58)
    };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    await expect(measurementResult).toBeVisible();
    await expect(measurementResult).toContainText(/\d+(?:[.,]\d+)?\s*(mm|cm|m|km)\b/i);
});
