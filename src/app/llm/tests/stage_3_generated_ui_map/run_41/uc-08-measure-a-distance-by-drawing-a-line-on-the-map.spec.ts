// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurement = page.getByTestId('measurement');

    const readMeasurementText = async () =>
        ((await measurement.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toBeVisible();

    const initialMeasurementText = await readMeasurementText();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container is not interactable.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.35)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.65),
            y: Math.round(mapBox.height * 0.45)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(mapBox.width * 0.75),
            y: Math.round(mapBox.height * 0.55)
        }
    });

    await expect.poll(readMeasurementText).not.toBe(initialMeasurementText);
    await expect.poll(readMeasurementText).toMatch(
        /\b(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s?(?:m|km)\b/i
    );
});
