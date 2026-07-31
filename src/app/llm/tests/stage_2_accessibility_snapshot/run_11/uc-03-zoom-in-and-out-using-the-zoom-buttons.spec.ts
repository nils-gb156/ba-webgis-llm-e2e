// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  
  // Helper to get current zoom level from the scale viewer or map state
  // Since we don't have explicit map helpers, we can infer zoom changes by
  // checking the scale viewer text which updates with zoom changes.
  // "Current scale: 1 to <number>" - smaller number means higher zoom (closer)
  // Actually, usually scale 1:X where X is smaller at higher zoom.
  // Let's verify this assumption by polling the scale viewer.
  
  const getScaleDenominator = async () => {
    const text = await page.getByTestId('scale-viewer').textContent();
    // Expected format: "Current scale: 1 to 2739072"
    const match = text?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  // Get initial zoom level (scale denominator)
  const initialScale = await expect.poll(() => getScaleDenominator()).toBeDefined();
  expect(initialScale).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to complete by checking scale changes
  // Higher zoom means smaller scale denominator (closer to ground)
  const scaleAfterZoomIn = await expect.poll(() => getScaleDenominator()).toBeDefined();
  expect(scaleAfterZoomIn).toBeLessThan(initialScale!);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to complete by checking scale changes
  // Lower zoom means larger scale denominator (further from ground)
  const scaleAfterZoomOut = await expect.poll(() => getScaleDenominator()).toBeDefined();
  expect(scaleAfterZoomOut).toBeGreaterThan(scaleAfterZoomIn);
});
