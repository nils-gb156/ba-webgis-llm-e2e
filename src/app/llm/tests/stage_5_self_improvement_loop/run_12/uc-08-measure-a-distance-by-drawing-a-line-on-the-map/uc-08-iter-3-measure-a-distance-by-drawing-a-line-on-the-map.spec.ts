// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The button has role="button" (not checkbox/radio), so we use getByTestId or getByRole('button').
  // We check if it's already pressed (active). If so, the panel is already open.
  const measurementToggle = page.getByTestId('measurement-toggle');
  
  // Check current pressed state to decide whether to click
  const isPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isPressed !== 'true') {
    await measurementToggle.click();
  }

  // Verify the measurement panel is visible
  // The panel is likely a dialog or a panel with accessible name "Measurement"
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Draw a line on the map
  // Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');
  // Use positions that are likely on the map canvas area
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 200 } });

  // 3. Finish the measurement by double-clicking
  // Double-click at the last point to finish the line
  await mapContainer.dblclick({ position: { x: 400, y: 200 } });

  // 4. Verify the measurement result is displayed
  // The measurement panel should still be visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement result is displayed in the measurement panel, typically as text
  // We look for a numeric value followed by a unit (e.g., "m", "km") within the measurement panel
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect.poll(() => measurementPanel.textContent()).toMatch(/[\d.]+\s*(m|km)/i);
});
