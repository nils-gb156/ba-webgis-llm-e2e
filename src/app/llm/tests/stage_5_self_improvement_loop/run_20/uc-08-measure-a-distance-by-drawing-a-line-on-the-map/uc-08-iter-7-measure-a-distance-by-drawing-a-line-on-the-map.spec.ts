// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The toggle button is already in the pressed state? No, it's not.
  // Check if it's already pressed to avoid closing the panel instead of opening it.
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isPressed !== 'true') {
    await measurementToggle.click();
  }

  // The measurement panel (dialog) should be visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click points far enough apart to get a measurable distance
  // Using positions that are likely to be on the map canvas and not on any UI overlay
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 500, y: 300 } });
  await mapContainer.click({ position: { x: 500, y: 500 } });

  // 3. Double-click to finish the measurement
  // The double-click should be on the last point or near it to finish the line
  await mapContainer.dblclick({ position: { x: 500, y: 500 } });

  // Expected results
  // The measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement panel displays a length value with a unit
  // The dialog contains elements like a paragraph or span with the measurement result
  // We need to wait for the measurement result to appear in the dialog
  // The result is likely displayed as text within the dialog, e.g., "Distance: 1234 m" or just "1234 m"
  // Let's look for a number followed by a unit
  await expect.poll(() =>
    page.getByRole('dialog', { name: 'Measurement' }).textContent()
  ).toMatch(/(\d+(\.\d+)?)\s*(m|km|mi|ft)/);
});
