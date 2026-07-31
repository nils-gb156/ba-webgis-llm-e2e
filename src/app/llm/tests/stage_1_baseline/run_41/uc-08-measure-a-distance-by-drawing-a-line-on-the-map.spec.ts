// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be present and interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // Using getByRole with exact name to avoid ambiguity with other buttons if any.
  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await measurementButton.click();

  // Verify the measurement panel is visible.
  // Assuming the panel has a test id or is identifiable by role/text.
  // Since no specific test id for the panel is guaranteed, we look for a dialog or panel.
  // Often measurement panels are dialogs or side panels. Let's try to find a container related to measurement.
  // If no specific test id, we might look for a heading or text inside the panel.
  // Let's assume the panel becomes visible and contains some measurement-related UI.
  // We will wait for a generic "measurement" indicator or the panel itself.
  // A safe bet is to wait for the button to be in an active state or a specific panel to appear.
  // Let's look for a panel that might have a test id like 'measurement-panel' or similar.
  // If not, we look for a role.
  // Let's try to find an element that indicates the panel is open.
  // Often, the measurement tool might highlight the map or show a specific UI element.
  // Let's assume there is a container for the measurement results or the panel itself.
  // If no test id is known, we might rely on the fact that clicking the button opens a panel.
  // Let's wait for the measurement panel to be visible. We'll look for a common pattern.
  // If the application uses a specific component for the measurement panel, it might have a test id.
  // Let's try to find a dialog or panel with "Measurement" in the title or role.
  const measurementPanel = page.getByRole('dialog', { name: /Measurement/i }).first();
  // If it's not a dialog, it might be a side panel. Let's try to find any element with 'measurement' in its test id or text.
  const measurementPanelFallback = page.locator('[data-testid*="measurement"]').first();
  
  // Wait for either the dialog or the fallback panel to be visible
  await expect(measurementPanel.or(measurementPanelFallback)).toBeVisible({ timeout: 10000 });

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll use the mapCanvas locator.
  // We need to get the bounding box of the canvas to click on it.
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas is not visible or has no bounding box');
  }

  // Define points to click to draw a line.
  // We'll click a few points in a line pattern.
  const points = [
    { x: box.x + 100, y: box.y + 100 },
    { x: box.x + 200, y: box.y + 200 },
    { x: box.x + 300, y: box.y + 100 },
  ];

  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    // Small delay between clicks to simulate user drawing
    await page.waitForTimeout(200);
  }

  // Step 3: Double-click to finish the measurement.
  // Double-click on the last point or nearby to finish.
  const lastPoint = points[points.length - 1];
  await page.mouse.dblclick(lastPoint.x, lastPoint.y);

  // Expected results:
  // - The measurement panel is visible. (Already asserted above, but we can re-assert)
  // - The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear.
  // The result might be displayed in the panel. Let's look for text that resembles a length with a unit (e.g., "123 m", "1.2 km").
  // We'll use expect.poll to wait for the result to appear.
  await expect.poll(async () => {
    // Try to find text that looks like a measurement result.
    // It might be in the panel. Let's search within the panel or the whole page for a pattern.
    // Common patterns: "Length:", "Distance:", followed by a number and unit.
    // Let's try to get text from the measurement panel if it's identifiable.
    const panel = measurementPanel.or(measurementPanelFallback);
    if (await panel.isVisible()) {
      const text = await panel.textContent();
      return text;
    }
    return '';
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i, { timeout: 10000 });
});
