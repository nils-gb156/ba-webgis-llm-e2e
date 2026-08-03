// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const measurementPanel = page.getByTestId('measurement-panel');
    if (!(await measurementPanel.isVisible())) {
        await page.getByTestId('measurement-toggle').click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(page.getByTestId('measurement')).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 180, y: 180 } });
    await mapContainer.click({ position: { x: 280, y: 210 } });
    await mapContainer.click({ position: { x: 380, y: 250 } });
    await mapContainer.dblclick({ position: { x: 500, y: 300 } });

    await expect(measurementPanel).toContainText(/\b\d+(?:[.,]\d+)?\s*(mm|cm|m|km)\b/i);
});
