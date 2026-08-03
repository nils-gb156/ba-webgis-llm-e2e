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
    await expect.poll(async () => typeof (await getMapZoomLevel(page))).toBe('number');

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    await mapContainer.click({ position: { x: 420, y: 180 } });
    await mapContainer.click({ position: { x: 560, y: 240 } });
    await mapContainer.click({ position: { x: 700, y: 300 } });
    await mapContainer.dblclick({ position: { x: 820, y: 360 } });

    await expect(measurementPanel).toContainText(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
