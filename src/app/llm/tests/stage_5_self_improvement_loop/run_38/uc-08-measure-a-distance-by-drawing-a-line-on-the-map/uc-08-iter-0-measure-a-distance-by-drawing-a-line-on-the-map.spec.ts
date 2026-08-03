// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const measurementPanelIndicatorCount = async () => {
        const dialogCount = await page.getByRole('dialog', { name: 'Measurement', exact: true }).count();
        const headingCount = await page.getByRole('heading', { name: 'Measurement', exact: true }).count();
        const lengthLabelCount = await page.getByText(/\bLength\b/i).count();
        return dialogCount + headingCount + lengthLabelCount;
    };

    if ((await measurementPanelIndicatorCount()) === 0) {
        await measurementToggle.click();
    }

    await expect.poll(measurementPanelIndicatorCount).toBeGreaterThan(0);

    await mapContainer.click({ position: { x: 420, y: 220 } });
    await mapContainer.click({ position: { x: 560, y: 280 } });
    await mapContainer.click({ position: { x: 700, y: 250 } });
    await mapContainer.dblclick({ position: { x: 840, y: 320 } });

    const nonZeroLengthResult = page.getByText(
        /\bLength\b[\s\S]*\b[1-9]\d*(?:[.,]\d+)?\s*(?:m|km)\b/i
    );

    await expect.poll(async () => await nonZeroLengthResult.count()).toBeGreaterThan(0);
    await expect(nonZeroLengthResult.first()).toBeVisible();
});
