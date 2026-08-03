// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../map-model-helpers';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.5),
            y: Math.round(box.height * 0.58)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.58),
            y: Math.round(box.height * 0.64)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(box.width * 0.66),
            y: Math.round(box.height * 0.56)
        }
    });

    await expect(measurementPanel).toContainText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
