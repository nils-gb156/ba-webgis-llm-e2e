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
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? null).not.toBeNull();

    if ((await measurementToggle.getAttribute('aria-pressed')) !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();

    await mapContainer.click({ position: { x: 120, y: 140 } });
    await mapContainer.click({ position: { x: 220, y: 180 } });
    await mapContainer.click({ position: { x: 320, y: 220 } });
    await mapContainer.dblclick({ position: { x: 420, y: 260 } });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toContainText(/\b\d[\d.,\s]*\s?(?:m|km)\b/i);
});
