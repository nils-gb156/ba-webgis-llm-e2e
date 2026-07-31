// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Assert the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click the first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click the second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Click the third point
  await mapContainer.click({ position: { x: 300, y: 100 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 300, y: 100 } });

  // Wait for the measurement result to settle
  // The measurement element should display a length value with a unit
  const measurementElement = page.getByTestId('measurement');
  await expect.poll(() => measurementElement.innerText()).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
