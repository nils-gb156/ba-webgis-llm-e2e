// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the scale viewer which updates with zoom changes
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  // Get initial zoom level from the scale viewer text "Current scale: 1 to X"
  // Higher zoom level means smaller scale denominator
  const getInitialScaleDenominator = async () => {
    const scaleText = await page.getByTestId('scale-viewer').textContent();
    const match = scaleText?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  const initialDenominator = await getInitialScaleDenominator();
  expect(initialDenominator).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  // Zooming in means the scale denominator should decrease
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await zoomInButton.click();

  // Wait for zoom to settle by polling the scale viewer
  await expect.poll(async () => {
    const currentDenominator = await getInitialScaleDenominator();
    return currentDenominator;
  }).toBeLessThan(initialDenominator!);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  // Zooming out means the scale denominator should increase
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await zoomOutButton.click();

  // Wait for zoom to settle and verify denominator increased compared to after zoom in
  const denominatorAfterZoomIn = await getInitialScaleDenominator();
  
  await expect.poll(async () => {
    const currentDenominator = await getInitialScaleDenominator();
    return currentDenominator;
  }).toBeGreaterThan(denominatorAfterZoomIn);
});
