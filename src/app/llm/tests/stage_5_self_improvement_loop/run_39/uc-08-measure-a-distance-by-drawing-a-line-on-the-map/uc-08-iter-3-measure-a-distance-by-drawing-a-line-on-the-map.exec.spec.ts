// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the measurement tool
    // The measurement toggle button in the toolbar.
    // We check its pressed state first; if already pressed we skip the click.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementPressed !== 'true') {
        await measurementToggle.click();
    }

    // Wait for the measurement panel/dialog to appear.
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
    await expect(measurementDialog).toBeVisible();

    // Step 2: Draw a line by clicking points on the map canvas.
    // The map container is identified by 'map-container'.
    // We must click the map container with a position option.
    // The basemap combobox dropdown was intercepting pointer events in the previous
    // attempt. We need to close it first if it's open.
    const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
    const isBasemapExpanded = await basemapCombobox.getAttribute('aria-expanded');
    if (isBasemapExpanded === 'true') {
        await basemapCombobox.click();
    }

    const mapContainer = page.getByTestId('map-container');

    // Click point 1 (slightly offset from center)
    await mapContainer.click({ position: { x: 100, y: 100 } });
    // Click point 2 (further away)
    await mapContainer.click({ position: { x: 200, y: 200 } });
    // Click point 3 (to make a longer line)
    await mapContainer.click({ position: { x: 300, y: 150 } });

    // Step 3: Double-click to finish the measurement.
    await mapContainer.dblclick({ position: { x: 300, y: 150 } });

    // Expected results:
    // The measurement panel is visible.
    // The measurement panel displays a length value with a unit.

    // The measurement dialog should still be visible.
    await expect(measurementDialog).toBeVisible();

    // The measurement result should appear in the dialog.
    // We'll poll for a string that looks like a measurement result.
    // Common formats: "Length: 12.3 km", "Distance: 500 m", etc.
    // We'll use a regex to match a number followed by a unit.
    const measurementRegex = /Length:\s*\d+\.?\d*\s*(km|m|mi|ft)/i;

    // Poll the measurement dialog's text content for the measurement result.
    await expect.poll(async () => {
        const text = await measurementDialog.textContent();
        return text ? measurementRegex.test(text) : false;
    }).toBe(true);
});
