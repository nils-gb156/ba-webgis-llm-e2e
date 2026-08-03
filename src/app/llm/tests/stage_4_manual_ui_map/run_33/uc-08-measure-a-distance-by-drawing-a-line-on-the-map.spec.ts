// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

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

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: box.x + box.width * 0.55, y: box.y + box.height * 0.45 },
        { x: box.x + box.width * 0.65, y: box.y + box.height * 0.5 },
        { x: box.x + box.width * 0.75, y: box.y + box.height * 0.55 },
        { x: box.x + box.width * 0.85, y: box.y + box.height * 0.6 }
    ];

    await page.mouse.click(points[0].x, points[0].y);
    await page.mouse.click(points[1].x, points[1].y);
    await page.mouse.click(points[2].x, points[2].y);
    await page.mouse.dblclick(points[3].x, points[3].y);

    await expect(measurement).toContainText(/\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i);
});
