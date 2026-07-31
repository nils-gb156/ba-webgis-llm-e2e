// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and operational layers to be ready.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel/dialog is visible.
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click a first point.
  await mapContainer.click({ position: { x: 400, y: 300 } });
  // Click a second point.
  await mapContainer.click({ position: { x: 500, y: 300 } });
  // Click a third point.
  await mapContainer.click({ position: { x: 600, y: 300 } });

  // Step 3: Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 600, y: 300 } });

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement result is shown as a tooltip on the map (e.g. "74.11 km").
  // We can verify this by checking the tooltip content.
  const tooltip = page.getByRole('tooltip');
  await expect.poll(() => tooltip.textContent()).toMatch(/\d+(\.\d+)?\s+(km|m|mi|ft)/i);
});
