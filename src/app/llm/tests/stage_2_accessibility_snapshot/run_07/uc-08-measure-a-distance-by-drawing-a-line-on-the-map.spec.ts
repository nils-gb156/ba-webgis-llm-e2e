// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await expect(page.locator('#map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible (using the map controls panel or a specific test id if available,
  // but generally the presence of the tool being active is indicated by the toggle state or a panel).
  // Since there is no specific test id for the measurement panel content in the provided list,
  // we assert the toggle is in a pressed/active state if possible, or look for the panel.
  // The prompt mentions "measurement-toggle" as a test id.
  const measurementToggleElement = page.getByTestId('measurement-toggle');
  await expect(measurementToggleElement).toBeVisible();
  // Check if it's pressed (active). If the button toggles, it should be pressed after click.
  // We will assume the UI updates the aria-pressed state.
  await expect(measurementToggleElement).toHaveAttribute('aria-pressed', 'true');

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to get the bounding box of the map container to click relative positions.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Define points for a line. Start near the center, then move right and up/down.
  const startX = mapBox.x + mapBox.width / 2;
  const startY = mapBox.y + mapBox.height / 2;
  const endX = mapBox.x + mapBox.width * 0.7;
  const endY = mapBox.y + mapBox.height * 0.3;
  const midX = mapBox.x + mapBox.width * 0.4;
  const midY = mapBox.y + mapBox.height * 0.6;

  // Click first point (start)
  await page.mouse.click(startX, startY);
  // Click second point (mid)
  await page.mouse.click(midX, midY);
  // Click third point (end)
  await page.mouse.click(endX, endY);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(endX, endY);

  // Expected results:
  // - The measurement panel is visible. (Already checked via toggle state, but let's ensure UI is stable)
  // - The measurement panel displays a length value with a unit.
  
  // The measurement result is likely displayed in the info-panel or a specific measurement result container.
  // Looking at the test ids: 'info-panel' is present. Let's check if the measurement result appears there.
  // Alternatively, it might be in the 'map-controls-panel'.
  // Since the prompt doesn't specify a specific test id for the measurement result, we look for text matching a distance pattern.
  
  // Try to find the measurement result in the info panel or generally on the page.
  // We expect a number followed by a unit like 'm', 'km', 'mi'.
  const measurementResultRegex = /[\d.,]+\s*(m|km|mi|ft)/i;
  
  // Poll for the measurement result to appear. It might appear in the info panel or a toast/notification.
  // Let's check the info panel first as it's a common place for such details.
  const infoPanel = page.getByTestId('info-panel');
  
  await expect.poll(async () => {
    // Check if any text on the page matches the measurement pattern
    const bodyText = await page.locator('body').textContent();
    return bodyText?.match(measurementResultRegex);
  }).toBeTruthy();

  // Additionally, verify the measurement tool is still active or the panel is closed/updated.
  // The prompt says "measurement panel is visible".
  // If the panel closes after measurement, the assertion on the toggle state might change.
  // However, "The measurement panel is visible" is an expected result.
  // Let's assume the panel stays open or the result is visible in a panel.
  
  // If the result is in the info panel, let's assert it's visible.
  await expect(infoPanel).toBeVisible();
});
