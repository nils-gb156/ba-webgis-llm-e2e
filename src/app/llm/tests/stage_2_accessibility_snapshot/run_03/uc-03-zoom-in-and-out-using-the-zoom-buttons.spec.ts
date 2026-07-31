// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the map container and a stable scale
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  // Get the initial zoom level from the scale viewer text
  const initialScaleText = await page.getByTestId('scale-viewer').textContent();
  const initialScaleMatch = initialScaleText?.match(/1 to (\d+)/);
  test.skip(!initialScaleMatch, 'Could not parse initial scale');
  const initialScaleDenominator = parseInt(initialScaleMatch![1], 10);

  // Step 1: Click the 'Zoom in' button to increase the zoom level (smaller scale denominator)
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for the scale to update after zooming in
  await expect.poll(async () => {
    const scaleText = await page.getByTestId('scale-viewer').textContent();
    const match = scaleText?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }).toBeLessThan(initialScaleDenominator);

  const zoomedInScaleText = await page.getByTestId('scale-viewer').textContent();
  const zoomedInScaleMatch = zoomedInScaleText?.match(/1 to (\d+)/);
  test.skip(!zoomedInScaleMatch, 'Could not parse zoomed in scale');
  const zoomedInScaleDenominator = parseInt(zoomedInScaleMatch![1], 10);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level (larger scale denominator)
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for the scale to update after zooming out
  await expect.poll(async () => {
    const scaleText = await page.getByTestId('scale-viewer').textContent();
    const match = scaleText?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }).toBeGreaterThan(zoomedInScaleDenominator);

  const finalScaleText = await page.getByTestId('scale-viewer').textContent();
  const finalScaleMatch = finalScaleText?.match(/1 to (\d+)/);
  test.skip(!finalScaleMatch, 'Could not parse final scale');
  const finalScaleDenominator = parseInt(finalScaleMatch![1], 10);

  // Verify that the final scale denominator is larger than the zoomed-in scale denominator
  expect(finalScaleDenominator).toBeGreaterThan(zoomedInScaleDenominator);
});
