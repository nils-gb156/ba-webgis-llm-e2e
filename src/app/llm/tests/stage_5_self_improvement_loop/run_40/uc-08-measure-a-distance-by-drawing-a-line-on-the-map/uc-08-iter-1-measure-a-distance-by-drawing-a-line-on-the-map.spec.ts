// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The measurement toggle is already in the unpressed state, so clicking it opens the panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  // We click on the map container at different positions.
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click second point
  await mapContainer.click({ position: { x: 400, y: 400 } });
  // Click third point
  await mapContainer.click({ position: { x: 500, y: 500 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 500, y: 500 } });

  // Expected results
  // The measurement panel is visible.
  // The measurement panel displays a length value with a unit.
  const measurementResultPattern = /[\d.]+\s*(km|m|cm|mm|mi|ft|in)/i;

  // Wait for the measurement result to appear in the measurement panel
  await expect.poll(async () => {
    const measurementPanelText = await measurementPanel.innerText();
    return measurementResultPattern.test(measurementPanelText);
  }).toBe(true);
});
