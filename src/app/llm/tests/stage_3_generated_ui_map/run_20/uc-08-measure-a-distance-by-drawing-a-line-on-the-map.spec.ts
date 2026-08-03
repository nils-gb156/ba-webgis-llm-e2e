// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.58),
        y: Math.round(box.height * 0.42)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.68),
        y: Math.round(box.height * 0.50)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.80),
        y: Math.round(box.height * 0.58)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    await expect.poll(async () => {
        return (await measurementContent.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
    }).toMatch(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
