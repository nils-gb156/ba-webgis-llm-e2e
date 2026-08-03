// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('measurement-toggle')).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementButton = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByRole('dialog');

    if (!(await measurementPanel.isVisible())) {
        await measurementButton.click();
    }

    await expect(measurementPanel).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 520, y: 220 } });
    await mapContainer.click({ position: { x: 700, y: 300 } });
    await mapContainer.dblclick({ position: { x: 880, y: 380 } });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementPanel).toContainText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/);
});
