// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementPanel.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();
    await expect(measurementPanel.getByRole('combobox', { name: 'Mode', exact: true })).toBeVisible();

    await mapContainer.click({ position: { x: 450, y: 250 } });
    await mapContainer.click({ position: { x: 650, y: 320 } });
    await mapContainer.click({ position: { x: 820, y: 380 } });
    await mapContainer.dblclick({ position: { x: 980, y: 460 } });

    const measurementResult = page
        .getByRole('tooltip', { name: /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i })
        .first();

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResult).toBeVisible();
    await expect(measurementResult).toHaveText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
