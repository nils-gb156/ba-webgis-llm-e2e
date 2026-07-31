// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Store the initial map center to click relative to it later
    const initialCenter = await getMapCenter(page);
    expect(initialCenter).toBeDefined();

    // Step 1: Activate the measurement tool
    // The accessibility tree shows "Measurement" as a button.
    // The toolbar toggle buttons may already be in the active state, but measurement is typically off.
    // We click it and then assert the panel is visible.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // Step 2: Draw a line by clicking points on the map canvas
    // We click a few points around the initial center to draw a line segment.
    // The map canvas is identified by the 'map-container' test id.
    const mapContainer = page.getByTestId('map-container');

    // Click point 1 (slightly offset from center)
    await mapContainer.click({ position: { x: 100, y: 100 } });
    // Click point 2 (further away)
    await mapContainer.click({ position: { x: 200, y: 200 } });
    // Click point 3 (to make a longer line)
    await mapContainer.click({ position: { x: 300, y: 150 } });

    // Step 3: Double-click to finish the measurement
    // Double-clicking on the map canvas should finalize the measurement.
    await mapContainer.dblclick({ position: { x: 300, y: 150 } });

    // Expected results:
    // The measurement panel is visible.
    // The measurement panel displays a length value with a unit.
    // The measurement panel is likely part of the info panel or a separate floating panel.
    // Based on the UI context, the 'info-panel' is visible and has a 'Weather Forecast' heading.
    // The measurement result might appear in the info panel or a dedicated measurement panel.
    // Let's check if the info panel shows measurement results or if a new panel appears.
    // Often, measurement results are shown in a floating panel or the info panel.
    // Let's assume the info panel updates or a new panel appears.
    // We'll look for text that looks like a measurement (e.g., "Length:", numbers with units like "km", "m").

    // Wait for the measurement result to appear in the info panel or a dedicated panel.
    // We'll poll for the presence of a length value with a unit in the info panel or any visible panel.
    // Let's first check if the info panel is still visible and has measurement content.
    // If not, we might need to look for a specific measurement panel.
    // Given the complexity, we'll assert that the info panel (or a measurement panel) contains a length value.

    // Let's try to find the measurement result in the info panel first.
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // We'll poll for a string that looks like a measurement result.
    // Common formats: "Length: 12.3 km", "Distance: 500 m", etc.
    // We'll use a regex to match a number followed by a unit.
    const measurementRegex = /Length:\s*\d+\.?\d*\s*(km|m|mi|ft)/i;

    // Poll the info panel's text content for the measurement result.
    await expect.poll(async () => {
        const text = await infoPanel.textContent();
        return text ? measurementRegex.test(text) : false;
    }).toBe(true);
});
