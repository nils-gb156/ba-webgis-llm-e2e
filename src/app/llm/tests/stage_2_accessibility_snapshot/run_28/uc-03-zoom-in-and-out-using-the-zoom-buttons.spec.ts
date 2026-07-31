// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and we have a baseline zoom level
  // We use the scale viewer as a proxy for map state since no helper functions are provided.
  // The scale viewer text contains the current scale denominator.
  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // Extract initial scale denominator (approximate, as it might be dynamic)
  const initialScaleText = await scaleViewer.textContent();
  expect(initialScaleText).toMatch(/1 to \d+/);
  const initialMatch = initialScaleText.match(/1 to (\d+)/);
  expect(initialMatch).not.toBeNull();
  const initialDenominator = parseInt(initialMatch![1], 10);

  // Step 1: Click Zoom in button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await zoomInButton.click();

  // Wait for zoom to complete and scale to update
  await expect.poll(async () => {
    const text = await scaleViewer.textContent();
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }).toBeLessThan(initialDenominator);

  // Verify zoom in happened: scale denominator should be smaller
  const afterZoomInText = await scaleViewer.textContent();
  const afterZoomInMatch = afterZoomInText.match(/1 to (\d+)/);
  expect(afterZoomInMatch).not.toBeNull();
  const afterZoomInDenominator = parseInt(afterZoomInMatch![1], 10);
  expect(afterZoomInDenominator).toBeLessThan(initialDenominator);

  // Step 2: Click Zoom out button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await zoomOutButton.click();

  // Wait for zoom to complete and scale to update
  // The zoom out should result in a larger denominator than after zoom in
  await expect.poll(async () => {
    const text = await scaleViewer.textContent();
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }).toBeGreaterThan(afterZoomInDenominator);

  // Verify zoom out happened: scale denominator should be larger than after zoom in
  const afterZoomOutText = await scaleViewer.textContent();
  const afterZoomOutMatch = afterZoomOutText.match(/1 to (\d+)/);
  expect(afterZoomOutMatch).not.toBeNull();
  const afterZoomOutDenominator = parseInt(afterZoomOutMatch![1], 10);
  expect(afterZoomOutDenominator).toBeGreaterThan(afterZoomInDenominator);
});
