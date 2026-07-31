// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click({ force: true });

  // Verify measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map to draw a line
  // Use pixel offsets from the center of the map-container element to place clicks
  // on the canvas. Using relative pixel offsets avoids coordinate system confusion
  // and ensures clicks land on the canvas regardless of the map's current view.
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
  // The dialog contains a paragraph with the measurement result.
  await expect(measurementPanel).toBeVisible();

  // Verify measurement panel displays a length value with a unit
  // The measurement result is shown as a paragraph within the dialog.
  await expect.poll(() =>
    measurementPanel
      .getByRole('paragraph')
      .allTextContents()
      .then((texts) => texts.some((t) => /\d+\.?\d*\s*(km|m|mi|ft)/.test(t)))
  ).toBe(true);
});
