// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the measurement toggle to open the panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');

  // Ensure the panel is closed before starting, in case it was left open from a previous run
  const initialPanelState = await measurementPanel.isVisible().catch(() => false);
  if (initialPanelState) {
    await measurementToggle.click();
    await expect(measurementPanel).not.toBeVisible();
  }

  // Click to open the measurement panel
  await measurementToggle.click();
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 100 } });
  // Click third point
  await mapContainer.click({ position: { x: 200, y: 200 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 200, y: 200 } });

  // Expected results: The measurement panel is visible and displays a length value with a unit
  await expect(measurementPanel).toBeVisible();

  // The measurement result is inside the measurement panel.
  // We look for text that resembles a length value with a unit (e.g., "1.23 km", "500 m")
  const measurementResult = page.getByTestId('measurement');
  await expect(measurementResult).toBeVisible();

  // Use expect.poll to wait for the measurement value to settle, as it might take a moment to calculate
  await expect.poll(async () => {
    const text = await measurementResult.textContent();
    return text;
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
