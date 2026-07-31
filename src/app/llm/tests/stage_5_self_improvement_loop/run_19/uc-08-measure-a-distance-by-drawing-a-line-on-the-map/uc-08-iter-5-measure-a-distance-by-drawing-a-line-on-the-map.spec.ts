// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');

  // Ensure a clean state: toggle is pressed only when panel is visible.
  // If panel is already visible, toggle it off and then on again.
  if (await measurementPanel.isVisible()) {
    await measurementToggle.click({ force: true });
    await expect(measurementPanel).not.toBeVisible();
  }
  await measurementToggle.click({ force: true });
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click second point
  await mapContainer.click({ position: { x: 500, y: 300 } });
  // Click third point
  await mapContainer.click({ position: { x: 400, y: 500 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 500 } });

  // Expected results:
  // - The measurement panel is visible.
  await expect(measurementPanel).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // The measurement result is displayed inside the measurement dialog.
  // Based on the failure output, the dialog initially says "Click in the map to start a measurement."
  // After drawing, it should show a length like "X.XX km" or similar.
  const measurementResultPattern = /\d+(\.\d+)?\s*(km|m|mi|ft)/i;

  await expect.poll(async () => {
    const text = await measurementPanel.textContent();
    return text;
  }).toMatch(measurementResultPattern);
});
