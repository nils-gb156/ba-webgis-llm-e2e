// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Activate measurement tool
  // The measurement toggle might already be in the correct state or not.
  // We want it OPEN. If it's already open, clicking it closes it.
  // We check the panel visibility first.
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const isPanelVisible = await measurementPanel.isVisible();
  if (isPanelVisible) {
    // Panel is already open, which is the desired state. No click needed.
  } else {
    // Panel is closed, click the toggle to open it.
    await measurementToggle.click();
  }

  // Verify measurement panel is visible
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Get the bounding box of the map container to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or not visible');
  }

  // Calculate center point
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click first point (center)
  await mapContainer.click({ position: { x: centerX, y: centerY } });

  // Click second point (offset to the right)
  await mapContainer.click({ position: { x: centerX + 100, y: centerY } });

  // Click third point (offset further right and down)
  await mapContainer.click({ position: { x: centerX + 200, y: centerY + 100 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: centerX + 200, y: centerY + 100 } });

  // Expected results:
  // 1. The measurement panel is visible (already asserted above, but good to ensure it stays visible)
  await expect(measurementPanel).toBeVisible();

  // 2. The measurement panel displays a length value with a unit
  // The measurement element inside the panel should show the result
  const measurementElement = page.getByTestId('measurement');
  await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
