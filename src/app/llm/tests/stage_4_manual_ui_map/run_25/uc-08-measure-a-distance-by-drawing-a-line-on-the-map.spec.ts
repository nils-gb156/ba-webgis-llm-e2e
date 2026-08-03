// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(async () => {
        const zoom = await getMapZoomLevel(page);
        return typeof zoom === 'number';
    }).toBe(true);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    const width = Math.round(mapBox!.width);
    const height = Math.round(mapBox!.height);

    const point1 = { x: Math.round(width * 0.55), y: Math.round(height * 0.55) };
    const point2 = { x: Math.round(width * 0.65), y: Math.round(height * 0.48) };
    const point3 = { x: Math.round(width * 0.75), y: Math.round(height * 0.58) };
    const point4 = { x: Math.round(width * 0.82), y: Math.round(height * 0.42) };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    await expect(measurementContent).toContainText(/\d+(?:[.,]\d+)?\s*(m|km)\b/i);
});
