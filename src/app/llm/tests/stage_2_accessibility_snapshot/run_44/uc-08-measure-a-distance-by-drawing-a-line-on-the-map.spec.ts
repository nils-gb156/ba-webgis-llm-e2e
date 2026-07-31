// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive by waiting for the map container
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  
  // Check current state of the measurement toggle to ensure we open it, not close it
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    // If already pressed, click it to close, then click again to open (or just ensure it's open)
    // Actually, the use case says "activate", implying it should be on. 
    // If it's already on, we might just proceed, but to be safe and explicit about "activating",
    // let's ensure it ends up in the 'pressed' state.
    // If it's pressed, clicking it unpresses it. So we should click it twice or just check if it's pressed.
    // Let's click it to ensure it's toggled to the desired state (pressed).
    // If it was pressed, click -> unpressed. Click again -> pressed.
    // If it was unpressed, click -> pressed.
    // So clicking twice ensures it is pressed.
    await measurementToggle.click();
    await measurementToggle.click();
  } else {
    await measurementToggle.click();
  }

  // Verify the measurement panel is visible. The panel is likely part of the map-controls-panel or similar.
  // Based on context, we don't have a specific testid for the measurement panel content, 
  // but we can infer visibility from the toggle state or look for specific elements.
  // Let's assert the toggle is pressed as a proxy for the panel being open/active.
  await expect(measurementToggle).toBeChecked(); // Note: toggle buttons often use aria-pressed, but Playwright's toBeChecked works for role=button with aria-pressed in some versions, or we can check attribute.
  // More robust: check aria-pressed attribute
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to click on the map container. We'll pick coordinates relative to the map container.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to determine click coordinates
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box not found');
  }

  // Click three points to draw a line (triangle shape)
  // Point 1: Center-ish
  const point1X = box.x + box.width * 0.3;
  const point1Y = box.y + box.height * 0.3;
  await page.mouse.click(point1X, point1Y);

  // Point 2: Right
  const point2X = box.x + box.width * 0.7;
  const point2Y = box.y + box.height * 0.3;
  await page.mouse.click(point2X, point2Y);

  // Point 3: Bottom Center
  const point3X = box.x + box.width * 0.5;
  const point3Y = box.y + box.height * 0.7;
  await page.mouse.click(point3X, point3Y);

  // Step 3: The user double-clicks to finish the measurement.
  // Double-click at the last point or anywhere on the map to finish.
  await page.mouse.dblclick(point3X, point3Y);

  // Expected results:
  // - The measurement panel is visible. (Already asserted via toggle state, but let's look for result)
  // - The measurement panel displays a length value with a unit.
  
  // The measurement result is likely displayed in the info-panel or a specific measurement result area.
  // Since we don't have a specific testid for the measurement result, we'll look for text patterns
  // that indicate a distance measurement (e.g., numbers followed by 'm', 'km', 'mi').
  // The info-panel is a good candidate for displaying such results.
  
  // Let's wait for the measurement result to appear in the info-panel or generally on the page.
  // We'll poll for a pattern that looks like a measurement value.
  await expect.poll(async () => {
    // Try to find text that matches a measurement pattern (e.g., "123.45 m" or "1.2 km")
    // We'll search within the info-panel first, then the whole page if needed.
    const infoPanel = page.getByTestId('info-panel');
    if (await infoPanel.isVisible()) {
      const text = await infoPanel.innerText();
      // Regex for number followed by optional decimal and unit
      return text.match(/\d+(\.\d+)?\s*(m|km|mi|ft)/i);
    }
    return null;
  }).toBeTruthy();
});
