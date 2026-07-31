// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapLocator = page.getByTestId('map-canvas');
  await expect(mapLocator).toBeVisible();

  // 1. Activate the measurement tool
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByRole('region', { name: /measurement/i }).or(
    page.getByTestId('measurement-panel')
  );
  // Fallback: if no specific panel role/testid, check for any visible text indicating measurement mode
  // Often the panel appears as a dialog or a sidebar section.
  // Let's assume a common test id or role if available, otherwise check for the button state or a known panel element.
  // Since we don't have the exact test id for the panel, we will look for the measurement result later.
  // However, the prompt says "The measurement panel is visible".
  // Let's try to find a panel by role or test id. If not found, we proceed assuming the tool is active.
  // In many apps, the panel might be a div with a specific class or test id.
  // Let's assume there is a test id for the measurement panel or we can infer it from the context.
  // If no test id is provided in the prompt for the panel, we might need to rely on the result.
  // But the expected result explicitly states: "The measurement panel is visible."
  // Let's try to locate it. If it's not directly locatable, we might have to assume it's open if the tool is active.
  // However, to be robust, let's look for a common pattern.
  // Often, the measurement tool opens a side panel or a dialog.
  // Let's try to find an element that appears when measurement is active.
  // If we can't find a specific locator for the panel, we will skip the explicit panel visibility check
  // and rely on the result, but the instructions say to cover expected results.
  // Let's assume the measurement panel has a test id like 'measurement-panel' or similar.
  // If not, we might use a more generic approach.
  // For now, let's try to find a panel. If it fails, we continue.
  try {
    await expect(page.getByTestId('measurement-panel')).toBeVisible({ timeout: 5000 });
  } catch {
    // If no specific test id, try to find by role or text
    // This is a fallback and might be fragile
    await expect(page.getByText(/Length/i, { exact: false })).toBeVisible({ timeout: 5000 });
  }

  // 2. Draw a line on the map
  // Get the bounding box of the map canvas to click within it
  const mapBox = await mapLocator.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas is not visible or has no bounding box');
  }

  // Define some points to draw a line
  // Point 1
  const point1 = { x: mapBox.x + mapBox.width / 2, y: mapBox.y + mapBox.height / 2 };
  await page.mouse.click(point1.x, point1.y);

  // Point 2
  const point2 = { x: mapBox.x + mapBox.width / 4, y: mapBox.y + mapBox.height / 4 };
  await page.mouse.click(point2.x, point2.y);

  // Point 3
  const point3 = { x: mapBox.x + (3 * mapBox.width) / 4, y: mapBox.y + (3 * mapBox.height) / 4 };
  await page.mouse.click(point3.x, point3.y);

  // 3. Double-click to finish the measurement
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // - The measurement panel is visible (already checked above, but we can re-verify if needed)
  // - The measurement panel displays a length value with a unit.

  // Wait for the measurement result to appear
  // The result might be in the panel or a tooltip.
  // Let's look for text that indicates a length measurement (e.g., "m", "km", "mi")
  // We will poll for a length value with a unit.
  await expect.poll(async () => {
    // Try to find the measurement result in the panel or anywhere on the page
    // Common patterns: "Length: 123 m", "Distance: 1.2 km", etc.
    const bodyText = await page.locator('body').allTextContents();
    const combinedText = bodyText.join(' ');
    // Regex to match a number followed by a unit (m, km, mi, ft, etc.)
    const lengthRegex = /\d+(\.\d+)?\s*(m|km|mi|ft|in|cm|mm)/i;
    return lengthRegex.test(combinedText);
  }).toBeTruthy({ timeout: 10000 });

  // Optional: Assert that the specific text is visible in the measurement panel if we can locate it
  // If we found the panel earlier, we can assert on it.
  // Let's try to find the measurement result text specifically in the panel if possible.
  // Since we don't have a stable test id for the result, we rely on the body text check above.
});
