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
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(-1);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container bounding box is not available.');
    }

    const points = [
        { x: Math.round(box.width * 0.35), y: Math.round(box.height * 0.62) },
        { x: Math.round(box.width * 0.48), y: Math.round(box.height * 0.52) },
        { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.44) },
        { x: Math.round(box.width * 0.74), y: Math.round(box.height * 0.36) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect.poll(async () => {
        return (await measurementContent.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
    }).toMatch(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i);
});
