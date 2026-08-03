// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const map = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurement = page.getByTestId('measurement');

    await expect(map).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurement).toBeVisible();

    const initialText = ((await measurement.textContent()) ?? '').trim();

    const box = await map.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.55),
        y: Math.round(box.height * 0.35)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.63),
        y: Math.round(box.height * 0.42)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.72),
        y: Math.round(box.height * 0.50)
    };
    const finalPoint = {
        x: Math.round(box.width * 0.80),
        y: Math.round(box.height * 0.60)
    };

    await map.click({ position: firstPoint });
    await map.click({ position: secondPoint });
    await map.click({ position: thirdPoint });
    await map.dblclick({ position: finalPoint });

    await expect(measurement).toContainText(/\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);

    await expect.poll(async () => {
        const text = ((await measurement.textContent()) ?? '').trim();
        if (!text || text === initialText) {
            return 0;
        }

        const match = text.match(/(\d+(?:[.,]\d+)?)\s*(km|m)\b/i);
        if (!match) {
            return 0;
        }

        let valueInMeters = Number(match[1].replace(',', '.'));
        if (match[2].toLowerCase() === 'km') {
            valueInMeters *= 1000;
        }

        return valueInMeters;
    }).toBeGreaterThan(0);
});
