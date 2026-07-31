// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the scale viewer or map container
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  
  // Check current state of the measurement toggle to ensure we open it, not close it
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    // If already pressed, click it to close, then click again to open to ensure clean state
    await measurementToggle.click({ force: true });
  }
  
  await measurementToggle.click({ force: true });
  
  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container. We'll pick a few distinct coordinates.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define points relative to the map container center
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  
  // Point 1: Center
  await page.mouse.click(centerX, centerY);
  
  // Point 2: Offset to the right
  await page.mouse.click(centerX + 100, centerY);
  
  // Point 3: Offset further right and down
  await page.mouse.click(centerX + 200, centerY + 100);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(centerX + 200, centerY + 100);

  // Expected results:
  // 1. The measurement panel is visible.
  // The measurement panel is likely the info panel or a specific measurement result container.
  // Based on the context, the "Information" heading is in the info panel.
  // Often measurement results appear in the info panel or a dedicated result box.
  // Let's look for the info panel or a specific measurement result.
  // The prompt mentions "info-panel" test id.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // 2. The measurement panel displays a length value with a unit.
  // We need to find text that looks like a measurement (e.g., "123.45 m" or similar).
  // We will poll the info panel content for a regex matching a number followed by a unit.
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const text = await infoPanel.textContent();
    return text;
  }).toMatch(/[\d.,]+\s*(m|km|mi|ft)/i);
});
