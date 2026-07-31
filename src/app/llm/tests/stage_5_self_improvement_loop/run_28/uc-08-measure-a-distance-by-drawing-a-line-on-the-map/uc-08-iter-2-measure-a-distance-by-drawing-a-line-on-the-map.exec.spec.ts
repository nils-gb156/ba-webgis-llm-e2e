// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be fully loaded and interactive.
    await expect(page.getByTestId('map-container')).toBeVisible();

    // 1. Activate the measurement tool.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. Click several points on the map to draw a line.
    const mapContainer = page.getByTestId('map-container');
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box not found');
    }

    // Calculate click positions: start, middle, end.
    const startX = mapBox.x + mapBox.width * 0.3;
    const startY = mapBox.y + mapBox.height * 0.3;
    const midX = mapBox.x + mapBox.width * 0.5;
    const midY = mapBox.y + mapBox.height * 0.5;
    const endX = mapBox.x + mapBox.width * 0.7;
    const endY = mapBox.y + mapBox.height * 0.7;

    await mapContainer.click({ position: { x: startX, y: startY } });
    await mapContainer.click({ position: { x: midX, y: midY } });
    await mapContainer.click({ position: { x: endX, y: endY } });

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: endX, y: endY } });

    // Verify the measurement panel is visible.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Verify the measurement panel displays a length value with a unit.
    // The result text (e.g. "668.92 km") is inside the dialog, likely in the group or as a paragraph.
    // We'll look for text matching a number followed by a unit within the dialog.
    await expect(measurementPanel.getByText(/\d+(\.\d+)?\s+(km|m|mi|ft)/)).toBeVisible();
});
