// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  // The button might already be pressed (active state) if the app opens it by default.
  // We click it to ensure the measurement panel is open.
  await measurementToggle.click({ force: true });

  // Verify measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');
  const center = await mapContainer.boundingBox();
  expect(center).toBeDefined();

  // Point 1: near center
  await mapContainer.click({
    position: { x: center!.width / 2, y: center!.height / 2 },
  });

  // Point 2: offset from center
  await mapContainer.click({
    position: { x: center!.width / 2 + 100, y: center!.height / 2 - 100 },
  });

  // Point 3: further offset
  await mapContainer.click({
    position: { x: center!.width / 2 + 200, y: center!.height / 2 - 50 },
  });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({
    position: { x: center!.width / 2 + 200, y: center!.height / 2 - 50 },
  });

  // Wait for the measurement result to settle
  await expect(measurementPanel).toBeVisible();

  // Verify measurement panel displays a length value with a unit
  // The measurement result is shown as a paragraph within the dialog.
  // The previous test failed because the regex did not match the text format.
  // The screenshot shows "192.22 km" in a tooltip, and the panel likely contains
  // a similar text. We'll look for a paragraph containing a number followed by a unit.
  await expect.poll(() =>
    measurementPanel
      .getByRole('paragraph')
      .allTextContents()
      .then((texts) => texts.some((t) => /\d+\.?\d*\s*(km|m|mi|ft|cm|mm)/.test(t)))
  ).toBe(true);
});
