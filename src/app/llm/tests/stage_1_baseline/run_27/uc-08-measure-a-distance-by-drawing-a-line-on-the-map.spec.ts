// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // We assume a test id for the map container or a general loading state.
  // Since no specific test ids are provided in the prompt, we wait for a reasonable load state.
  await page.waitForLoadState('networkidle');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  // We look for a button with the role 'button' and text 'Measurement'.
  // If there are multiple, we might need to scope it, but let's try the general one first.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Expected result: The measurement panel is visible.
  // We assume the panel has a test id or is identifiable by role/text.
  // Common pattern: a dialog or panel with title "Measurement" or similar.
  // Let's try to find a panel/dialog that appears. If no specific test id, we look for a role.
  // Often, panels are divs with specific aria-labels or are part of a dialog.
  // Let's assume the panel becomes visible and contains text related to measurement results later.
  // For now, we assert the button might have changed state or a panel appeared.
  // Since we don't have the exact test id for the panel, we'll wait for the measurement result to appear,
  // which implies the panel is visible.

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to click on the map canvas. The map is an OpenLayers canvas.
  // We need to find the map container. Usually, it's a div with a specific class or test id.
  // Without specific test ids, we might rely on the fact that clicking anywhere on the map works if the map is focused.
  // However, Playwright requires a visible element to click.
  // Let's assume the map container has a test id like 'map' or similar.
  // If not, we might need to find the canvas element.
  // Let's try to find the map container by role or text if available.
  // Often, the map is just a div. Let's try to click on the map area.
  // We'll use a generic locator for the map container if we can't find a specific one.
  // Assuming the map container is identifiable, let's try to find it.
  // If no test id is provided, we might use a CSS selector for the map container, e.g., '.ol-map' or similar.
  // But the instructions say to prefer test ids. Let's assume there is a test id for the map.
  // If not, we'll use a fallback. Let's assume the map container has a test id 'map-container'.
  const mapContainer = page.getByTestId('map-container'); // Hypothetical test id
  // If this fails, we might need to use a different locator.
  // Let's try to find the map canvas directly.
  const mapCanvas = page.locator('canvas.ol-layer'); // OpenLayers canvas selector

  // Click several points to draw a line.
  // We need coordinates. Let's get the bounding box of the map container.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    // Fallback if map-container test id doesn't exist
    const fallbackMapBox = await mapCanvas.boundingBox();
    if (!fallbackMapBox) {
      throw new Error('Map container not found');
    }
    // Use fallback box
    await page.mouse.click(fallbackMapBox.x + 100, fallbackMapBox.y + 100);
    await page.mouse.click(fallbackMapBox.x + 200, fallbackMapBox.y + 200);
  } else {
    // Click points on the map
    await page.mouse.click(mapBox.x + 100, mapBox.y + 100);
    await page.mouse.click(mapBox.x + 200, mapBox.y + 200);
    await page.mouse.click(mapBox.x + 300, mapBox.y + 300);
  }

  // Step 3: The user double-clicks to finish the measurement.
  // Double-click on the map to finish.
  if (!mapBox) {
    const fallbackMapBox = await mapCanvas.boundingBox();
    if (fallbackMapBox) {
      await page.mouse.dblclick(fallbackMapBox.x + 300, fallbackMapBox.y + 300);
    }
  } else {
    await page.mouse.dblclick(mapBox.x + 300, mapBox.y + 300);
  }

  // Expected results:
  // - The measurement panel is visible. (Implied by the result appearing)
  // - The measurement panel displays a length value with a unit.
  // We need to find the element that displays the measurement result.
  // Let's assume there is a test id for the measurement result, e.g., 'measurement-result'.
  // Or we look for text that matches a length pattern.
  const measurementResult = page.getByTestId('measurement-result');
  
  // Wait for the measurement result to be visible and contain a length value with a unit.
  // The value should be a number followed by a unit like 'm' or 'km'.
  await expect(measurementResult).toBeVisible();
  
  // Assert that the measurement result contains a length value with a unit.
  // We use expect.poll to wait for the value to settle.
  await expect.poll(() => measurementResult.textContent()).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
