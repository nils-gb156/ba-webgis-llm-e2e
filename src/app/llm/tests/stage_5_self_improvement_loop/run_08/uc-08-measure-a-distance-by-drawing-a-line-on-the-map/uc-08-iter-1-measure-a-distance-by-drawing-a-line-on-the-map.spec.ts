// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementDialog.getByRole('button', { name: 'Delete measurements', exact: true })).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const drawPositions = [
        { x: Math.round(mapBox.width * 0.46), y: Math.round(mapBox.height * 0.42) },
        { x: Math.round(mapBox.width * 0.56), y: Math.round(mapBox.height * 0.48) },
        { x: Math.round(mapBox.width * 0.66), y: Math.round(mapBox.height * 0.54) },
        { x: Math.round(mapBox.width * 0.76), y: Math.round(mapBox.height * 0.60) }
    ];

    await mapContainer.click({ position: drawPositions[0] });
    await mapContainer.click({ position: drawPositions[1] });
    await mapContainer.click({ position: drawPositions[2] });
    await mapContainer.dblclick({ position: drawPositions[3] });

    const lengthValueRegex = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;
    const measurementResult = page.getByRole('tooltip', { name: lengthValueRegex });

    await expect(measurementDialog).toBeVisible();
    await expect(measurementResult).toBeVisible();
    await expect(measurementResult).toContainText(lengthValueRegex);
});
