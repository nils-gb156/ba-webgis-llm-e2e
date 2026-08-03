// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurement = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toBeVisible();

    const initialMeasurementText = (((await measurement.textContent()) ?? '').replace(/\s+/g, ' ')).trim();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = { x: mapBox.width * 0.4, y: mapBox.height * 0.72 };
    const point2 = { x: mapBox.width * 0.55, y: mapBox.height * 0.56 };
    const point3 = { x: mapBox.width * 0.7, y: mapBox.height * 0.7 };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.dblclick({ position: point3 });

    await expect.poll(async () => {
        const text = (((await measurement.textContent()) ?? '').replace(/\s+/g, ' ')).trim();
        return text !== initialMeasurementText && /\b(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s?(?:km|m)\b/i.test(text);
    }).toBe(true);
});
