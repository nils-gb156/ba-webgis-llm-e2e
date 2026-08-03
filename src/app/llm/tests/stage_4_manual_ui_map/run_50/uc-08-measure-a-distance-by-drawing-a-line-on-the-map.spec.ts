// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const clickPoints = [
        { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.35) },
        { x: Math.round(box.width * 0.72), y: Math.round(box.height * 0.46) },
        { x: Math.round(box.width * 0.82), y: Math.round(box.height * 0.40) }
    ];
    const finishPoint = {
        x: Math.round(box.width * 0.88),
        y: Math.round(box.height * 0.55)
    };

    for (const point of clickPoints) {
        await mapContainer.click({ position: point });
    }
    await mapContainer.dblclick({ position: finishPoint });

    await expect(
        measurementContent.getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i).first()
    ).toBeVisible();
});
