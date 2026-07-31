// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Wait for the measurement dialog to appear
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // The map container is the canvas area. We click at distinct positions.
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
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // The measurement result is typically displayed in the measurement dialog.
  // We'll look for a pattern like "X.XX km" or "X.XX m" in the measurement dialog.
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });

  // Use a general locator to find text that looks like a measurement within the dialog.
  // We'll check if the dialog contains a measurement-like string.
  const measurementResultPattern = /\d+(\.\d+)?\s*(km|m|mi|ft)/i;

  await expect.poll(async () => {
    const text = await measurementDialog.textContent();
    return text;
  }).toMatch(measurementResultPattern);
});
