// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click first point (approximate center-ish)
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click second point
  await mapContainer.click({ position: { x: 400, y: 300 } });
  // Click third point
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Wait for the measurement result to appear and contain a length value
  const measurementResult = page.getByTestId('measurement');
  await expect(measurementResult).toBeVisible();

  // Assert that the measurement panel displays a length value with a unit
  // We poll because the calculation might take a moment after the double-click
  await expect.poll(async () => {
    const text = await measurementResult.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft|in|cm|mm)/i);
});
