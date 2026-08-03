// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const distanceMode = measurementDialog.getByRole('combobox', { name: 'Mode', exact: true });
    const resultTooltip = page.getByRole('tooltip', {
        name: /\d+(?:[.,]\d+)?\s*(?:m|km)\b/i
    });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if ((await measurementToggle.getAttribute('aria-pressed')) !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(distanceMode).toBeVisible();
    await expect(distanceMode).toHaveValue('Distance');

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(mapBox.width * 0.42), y: Math.round(mapBox.height * 0.35) },
        { x: Math.round(mapBox.width * 0.52), y: Math.round(mapBox.height * 0.44) },
        { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.51) },
        { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.58) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect(measurementPanel).toBeVisible();
    await expect(resultTooltip).toBeVisible();
    await expect(resultTooltip).toHaveText(/\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
