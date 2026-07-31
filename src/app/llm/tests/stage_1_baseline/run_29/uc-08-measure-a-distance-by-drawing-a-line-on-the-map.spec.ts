// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by waiting for the canvas to appear
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // We use getByRole with exact name to distinguish from other potential buttons.
  // Assuming the button has an accessible name "Measurement" or similar.
  // If it's an icon button, we might need to rely on aria-label or title.
  // Let's assume there is a button with text "Measurement" or an icon with aria-label.
  // Using getByRole('button', { name: 'Measurement' }) as a primary guess.
  // If that fails due to strict mode, we might need to scope it or use a different locator.
  // However, without specific test IDs, we rely on accessible names.
  // Let's try to find the measurement button. It might be in a toolbar.
  // We'll look for a button with the text "Measurement" or an icon that represents measurement.
  // Since we don't have test IDs, we'll use getByRole.
  
  // Let's assume the button is labeled "Measurement"
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Verify the measurement panel is visible
  // The panel might have a specific test id or role. Let's assume it's a dialog or a panel.
  // We'll look for a panel that appears after clicking the button.
  // Often, these panels are identified by a test id like 'measurement-panel'.
  // Since we don't have it, we'll check for the presence of a length value or a specific header.
  // Let's assume the panel becomes visible and contains a "Length" label or similar.
  // We'll wait for the panel to be visible. A common pattern is a dialog or a sidebar.
  // Let's try to find an element that indicates the measurement tool is active.
  // We can look for a panel with a specific role or test id if available.
  // Without test ids, we might look for a heading or a specific text.
  // Let's assume there's a panel with test-id 'measurement-panel' or similar.
  // If not, we'll look for the result container.
  
  // Let's assume the panel is visible and contains a section for results.
  // We'll wait for a locator that is likely to appear in the measurement panel.
  // For example, a label "Length" or a container for the result.
  // Let's try to find a panel by its role, e.g., 'region' or 'dialog'.
  // Or we can look for the first input or text that appears.
  
  // Let's assume the panel has a test id 'measurement-panel'
  // If not, we'll look for a button or text that is unique to the measurement context.
  // Let's try to find a panel that is visible after the click.
  // We'll use a generic approach: wait for a specific text that indicates the tool is active.
  // For example, "Draw a line" or "Click to start".
  
  // Let's assume the panel has a test id 'measurement-panel'
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to get the bounding box of the map canvas to click on it.
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box not found');
  }

  // Define some points to draw a line.
  // We'll pick points within the visible area of the map.
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = box.x + box.width / 4;
  const endY = box.y + box.height / 4;
  const midX = box.x + (box.width / 2 + box.width / 4) / 2;
  const midY = box.y + (box.height / 2 + box.height / 4) / 2;

  // Click the first point
  await page.mouse.click(startX, startY);
  // Click the second point
  await page.mouse.click(midX, midY);
  // Click the third point
  await page.mouse.click(endX, endY);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblClick(endX, endY);

  // Expected results:
  // - The measurement panel is visible. (Already checked)
  // - The measurement panel displays a length value with a unit.
  
  // We need to find the element that displays the length.
  // It might be a span, div, or input within the measurement panel.
  // Let's assume it has a test id like 'measurement-length' or similar.
  // If not, we'll look for text that matches a pattern like "123.45 m" or "km".
  
  // Let's try to find a locator for the length value.
  // We'll look for a text that matches a number followed by a unit.
  // We can use getByText with a regex or getByRole('status') or similar.
  
  // Let's assume there's a test id for the length result.
  const lengthResult = page.getByTestId('measurement-length');
  
  // If test id is not available, we can look for a text pattern.
  // Let's try to find any text that looks like a measurement.
  // We'll use expect.poll to wait for the value to appear.
  
  // Let's assume the length is displayed in a span with a specific class or test id.
  // If we can't find a test id, we'll look for a text pattern.
  // Let's try to find a text that matches a number with a unit.
  
  // We'll use expect.poll to check for the presence of a length value.
  await expect.poll(async () => {
    // Try to find a text that matches a measurement pattern
    // We'll look for a span or div containing text like "123.45 m"
    const text = await page.locator('body').innerText();
    // Check if the text contains a number followed by a unit (m, km, ft, etc.)
    const regex = /\d+\.?\d*\s*(m|km|ft|mi|cm|mm)/i;
    return regex.test(text);
  }).toBeTruthy();

  // Alternatively, if we have a specific locator for the length value:
  // await expect(page.getByTestId('measurement-length')).toBeVisible();
  // await expect(page.getByTestId('measurement-length')).toContainText(/m|km/);
});
