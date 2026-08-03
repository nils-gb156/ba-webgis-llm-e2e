// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');
    const mapContainer = page.getByTestId('map-container');

    await expect(measurementToggle).toBeVisible();
    await expect(mapContainer).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = {
        x: Math.round(mapBox.width * 0.25),
        y: Math.round(mapBox.height * 0.35)
    };
    const point2 = {
        x: Math.round(mapBox.width * 0.45),
        y: Math.round(mapBox.height * 0.45)
    };
    const point3 = {
        x: Math.round(mapBox.width * 0.65),
        y: Math.round(mapBox.height * 0.55)
    };
    const point4 = {
        x: Math.round(mapBox.width * 0.8),
        y: Math.round(mapBox.height * 0.4)
    };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    await expect.poll(async () => (await measurementContent.textContent()) ?? '').toMatch(
        /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i
    );
});
