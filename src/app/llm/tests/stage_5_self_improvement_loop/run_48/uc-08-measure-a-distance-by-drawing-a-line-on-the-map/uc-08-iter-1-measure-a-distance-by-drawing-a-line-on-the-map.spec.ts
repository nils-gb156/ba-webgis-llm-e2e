// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  // Click a few points around the center to draw a line
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await page.waitForTimeout(300);
  await mapContainer.click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(300);
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Check for a length value with a unit (e.g., "123 m" or "1.23 km")
  await expect(measurementPanel.getByText(/(\d+\.?\d*)\s*(m|km|m²|ha)/)).toBeVisible();
});
