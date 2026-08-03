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
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();

    const width = box!.width;
    const height = box!.height;

    await mapContainer.click({
        position: { x: Math.round(width * 0.58), y: Math.round(height * 0.38) }
    });
    await mapContainer.click({
        position: { x: Math.round(width * 0.68), y: Math.round(height * 0.46) }
    });
    await mapContainer.dblclick({
        position: { x: Math.round(width * 0.80), y: Math.round(height * 0.58) }
    });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toContainText(/\d[\d.,\s]*\s?(m|km)\b/i);
});
