// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button to open the measurement panel.
  await page.getByTestId('measurement-toggle').click();

  // Wait for the measurement panel (dialog) to become visible.
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // Get the map container to click on the canvas.
  const mapContainer = page.getByTestId('map-container');

  // 2. Click several points on the map canvas to draw a line.
  // Use force: true to bypass any overlaying decorative elements.
  await mapContainer.click({ position: { x: 100, y: 100 }, force: true });
  await mapContainer.click({ position: { x: 200, y: 200 }, force: true });
  await mapContainer.click({ position: { x: 300, y: 100 }, force: true });

  // 3. Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 100 }, force: true });

  // Expected results:
  // - The measurement panel is visible (already asserted above).
  // - The measurement panel displays a length value with a unit.
  const measurementPanel = page.getByTestId('measurement-panel');

  // Wait for the measurement result to appear. It should contain a number followed by a unit.
  await expect.poll(() =>
    measurementPanel.locator('text=/[\\d,.]+\\s*(km|m|mi|ft)/').first().isVisible()
  ).toBe(true);
});
