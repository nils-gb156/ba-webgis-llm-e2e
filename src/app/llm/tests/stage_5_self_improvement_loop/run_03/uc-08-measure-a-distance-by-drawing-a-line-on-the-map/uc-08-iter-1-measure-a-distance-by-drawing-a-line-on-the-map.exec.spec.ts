// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  // The measurement toggle may already be pressed (e.g. if the app restores state).
  // We click it to ensure the measurement tool is active.
  await measurementToggle.click();

  // Wait for the measurement panel to be visible
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click points at specific positions on the map canvas
  // These positions are chosen to be within the visible map area
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await page.waitForTimeout(500); // Small delay to ensure click is registered
  await mapContainer.click({ position: { x: 400, y: 400 } });
  await page.waitForTimeout(500); // Small delay to ensure click is registered
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 500, y: 300 } });

  // 4. The measurement panel is visible
  await expect(measurementPanel).toBeVisible();

  // 5. The measurement panel displays a length value with a unit
  // The measurement result is displayed inside the measurement panel
  // We look for text matching a number followed by a unit (e.g., "211.22 km")
  // Based on the accessibility tree, the measurement result is shown in a tooltip,
  // but the panel itself should also contain the result or the total length.
  // The accessibility tree shows a tooltip with "211.22 km", which is the result.
  // We should assert on the tooltip or the panel content.
  // The measurement panel contains a "Delete measurements" button and other controls.
  // The result is often shown in a tooltip or a dedicated result area.
  // Let's check for the tooltip first, as it's explicitly shown in the accessibility tree.
  await expect(page.getByRole('tooltip', { name: /[\d.]+\s*(km|m|mi|ft)/i })).toBeVisible();
});
