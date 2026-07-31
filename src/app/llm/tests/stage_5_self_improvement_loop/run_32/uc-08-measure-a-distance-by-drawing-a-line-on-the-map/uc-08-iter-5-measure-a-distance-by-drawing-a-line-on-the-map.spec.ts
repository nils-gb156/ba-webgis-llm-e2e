// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool.
  const measurementToggle = page.getByTestId('measurement-toggle');
  // The toggle might already be pressed (e.g. from a previous run or initial state).
  // We want it pressed. If it's not pressed, click it.
  if (!(await measurementToggle.getAttribute('aria-pressed'))) {
    await measurementToggle.click({ force: true });
  }

  // Verify the measurement panel is visible.
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click a few points around the center to draw a line.
  // Using positions relative to the map container to ensure clicks land on the canvas.
  await mapContainer.click({ position: { x: 200, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // 3. Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 300 } });

  // Expected results:
  // - The measurement panel is visible (already asserted).
  // - The measurement panel displays a length value with a unit.
  // The measurement result is displayed in a text element with data-testid="measurement".
  const measurementResult = measurementPanel.getByTestId('measurement');
  await expect(measurementResult).toBeVisible();
  await expect.poll(() => measurementResult.textContent()).toMatch(/(\d+(\.\d+)?\s*(km|m|mi|ft))/);
});
