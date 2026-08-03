// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.58),
        y: Math.round(box.height * 0.34)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.68),
        y: Math.round(box.height * 0.43)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.78),
        y: Math.round(box.height * 0.51)
    };
    const finalPoint = {
        x: Math.round(box.width * 0.86),
        y: Math.round(box.height * 0.60)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.click({ position: thirdPoint });
    await mapContainer.dblclick({ position: finalPoint });

    await expect(measurementPanel).toContainText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
