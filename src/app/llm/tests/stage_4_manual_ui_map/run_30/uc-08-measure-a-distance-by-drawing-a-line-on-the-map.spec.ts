// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const toolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurement = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(toolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    const width = Math.round(mapBox.width);
    const height = Math.round(mapBox.height);

    await mapContainer.click({
        position: {
            x: Math.round(width * 0.68),
            y: Math.round(height * 0.32)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(width * 0.76),
            y: Math.round(height * 0.44)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(width * 0.84),
            y: Math.round(height * 0.56)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(width * 0.90),
            y: Math.round(height * 0.64)
        }
    });

    await expect(measurementPanel).toBeVisible();
    await expect.poll(async () => {
        return ((await measurement.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    }).toMatch(/\b\d+(?:[.,]\d+)?(?:\s|\u00A0)?(?:mm|cm|m|km)\b/i);
});
