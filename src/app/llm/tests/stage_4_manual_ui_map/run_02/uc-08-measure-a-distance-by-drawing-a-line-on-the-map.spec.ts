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
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(-1);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.6),
            y: Math.round(box.height * 0.78),
        },
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.7),
            y: Math.round(box.height * 0.68),
        },
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.8),
            y: Math.round(box.height * 0.6),
        },
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(box.width * 0.88),
            y: Math.round(box.height * 0.5),
        },
    });

    await expect(measurementContent).toContainText(
        /(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s*(m|km)\b/i
    );
});
