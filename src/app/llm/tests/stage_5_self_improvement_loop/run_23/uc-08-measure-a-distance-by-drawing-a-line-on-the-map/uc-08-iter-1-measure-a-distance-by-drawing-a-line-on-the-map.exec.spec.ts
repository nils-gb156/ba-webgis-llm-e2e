// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementDialog).toBeVisible();
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();
    await expect(measurementDialog.getByRole('combobox', { name: 'Mode', exact: true })).toBeVisible();
    await expect(measurementDialog.getByRole('button', { name: 'Delete measurements', exact: true })).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(box.width * 0.48), y: Math.round(box.height * 0.38) },
        { x: Math.round(box.width * 0.58), y: Math.round(box.height * 0.46) },
        { x: Math.round(box.width * 0.68), y: Math.round(box.height * 0.54) },
        { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.62) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    const measurementValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/;
    const measurementTooltip = page.getByRole('tooltip', { name: measurementValuePattern });

    await expect(measurementDialog).toBeVisible();
    await expect(measurementTooltip).toBeVisible();
    await expect(measurementTooltip).toHaveText(measurementValuePattern);
});
