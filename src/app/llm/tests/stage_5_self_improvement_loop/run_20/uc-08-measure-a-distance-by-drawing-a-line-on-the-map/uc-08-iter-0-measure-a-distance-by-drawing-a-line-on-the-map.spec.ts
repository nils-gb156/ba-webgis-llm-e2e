// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from "../../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByRole('dialog', { name: /Measurement/i });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.55),
        y: Math.round(box.height * 0.38)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.62),
        y: Math.round(box.height * 0.48)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.70),
        y: Math.round(box.height * 0.55)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    await expect(
        measurementPanel.getByText(/\b\d[\d\s.,]*\s*(?:m|km)\b/i)
    ).toBeVisible();
});
