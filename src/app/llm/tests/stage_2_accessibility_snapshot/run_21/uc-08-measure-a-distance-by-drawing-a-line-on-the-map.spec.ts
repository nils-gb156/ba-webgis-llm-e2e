// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be reasonably ready before interacting
  await page.getByTestId('map-container').waitFor({ state: 'visible' });

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  
  // Check current state: if it's already pressed, the panel is likely open.
  // We want to ensure the measurement tool is active.
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  
  if (isMeasurementPressed !== 'true') {
    await measurementToggle.click({ force: true });
  }

  // Verify the measurement panel is visible (using the info-panel or a specific measurement panel if available, 
  // but typically the info-panel shows measurement results or a dedicated panel appears. 
  // Based on context, "info-panel" is present and "measurement-toggle" exists. 
  // Let's assume the result appears in the info-panel or a dedicated overlay. 
  // Since no specific "measurement-panel" testid is listed, we'll check for the presence of measurement data 
  // or the info panel being active/relevant. However, the prompt says "measurement panel is visible".
  // Looking at the accessibility tree, there is no explicit "measurement panel" heading, 
  // but there is an "Information" heading inside info-panel. 
  // Often, measurement results appear in the info-panel or a floating tooltip.
  // Let's assert the toggle is pressed as a proxy for the panel/tool being active.
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  // Step 2 & 3: The user clicks several points on the map canvas to draw a line, then double-clicks to finish.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to click within it
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or not visible');
  }

  // Calculate some points to draw a line. 
  // We'll pick 3 points to form a simple line segment.
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  
  const point1 = { x: centerX - 100, y: centerY };
  const point2 = { x: centerX + 100, y: centerY };
  const point3 = { x: centerX + 100, y: centerY - 100 };

  // Click first point
  await page.mouse.click(point1.x, point1.y);
  
  // Click second point
  await page.mouse.click(point2.x, point2.y);
  
  // Double-click third point to finish the measurement
  await page.mouse.dblclick(point3.x, point3.y);

  // Wait for the measurement result to appear. 
  // Since we don't have a specific testid for the measurement result text, 
  // we look for the info-panel which typically displays such results, 
  // or we poll for text that looks like a measurement (e.g., containing "m" or "km").
  // The expected result says "measurement panel displays a length value with a unit".
  // We'll check the info-panel for text matching a length pattern.
  
  const infoPanel = page.getByTestId('info-panel');
  
  // Use expect.poll to wait for the measurement result to appear in the info panel
  await expect.poll(async () => {
    const content = await infoPanel.textContent();
    return content;
  }).toMatch(/[\d.,]+\s*(m|km|mi|ft)/i, { timeout: 10000 });

  // Final assertion: Ensure the info panel (or measurement result area) is visible and contains the value
  await expect(infoPanel).toBeVisible();
});
