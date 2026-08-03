// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementResult = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = {
        x: Math.floor(mapBox.width * 0.62),
        y: Math.floor(mapBox.height * 0.32)
    };
    const point2 = {
        x: Math.floor(mapBox.width * 0.74),
        y: Math.floor(mapBox.height * 0.46)
    };
    const point3 = {
        x: Math.floor(mapBox.width * 0.66),
        y: Math.floor(mapBox.height * 0.62)
    };
    const point4 = {
        x: Math.floor(mapBox.width * 0.82),
        y: Math.floor(mapBox.height * 0.74)
    };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    await expect(measurementResult).toBeVisible();
    await expect.poll(async () => {
        return ((await measurementResult.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    }).toMatch(/\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
