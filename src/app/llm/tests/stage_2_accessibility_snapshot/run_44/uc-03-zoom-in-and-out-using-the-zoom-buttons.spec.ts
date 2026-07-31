// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the zoom buttons to be visible
  await expect(page.getByRole('button', { name: 'Zoom in map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out map' })).toBeVisible();

  // Get the initial zoom level using the scale viewer as a proxy for map state
  // Since we don't have explicit map helper functions in the prompt, we use the scale viewer text
  // which changes with zoom. However, scale is not a direct zoom level.
  // Let's assume we can read the map zoom from the page context or a specific element if available.
  // Looking at the context, there is no direct zoom level element.
  // However, the prompt mentions "Map state via helper functions (only if provided in the prompt)".
  // No helpers were provided in the prompt.
  // We must rely on DOM assertions or network requests.
  // Let's look for a scale viewer or similar.
  // There is a `scale-viewer` test id and a region "Scale" with text "Current scale: 1 to 2739072".
  // Scale changes with zoom. We can use this to assert zoom changes.

  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // Get initial scale text
  const initialScaleText = await scaleViewer.textContent();
  
  // Step 1: Click Zoom in
  await page.getByRole('button', { name: 'Zoom in map' }).click();

  // Wait for the scale to update (zoom in -> scale denominator decreases)
  // We use expect.poll to wait for the scale text to change
  await expect.poll(async () => {
    return await page.getByTestId('scale-viewer').textContent();
  }).not.toEqual(initialScaleText);

  const scaleAfterZoomIn = await page.getByTestId('scale-viewer').textContent();

  // Step 2: Click Zoom out
  await page.getByRole('button', { name: 'Zoom out map' }).click();

  // Wait for the scale to update again (zoom out -> scale denominator increases)
  // It should be different from the scale after zoom in
  await expect.poll(async () => {
    return await page.getByTestId('scale-viewer').textContent();
  }).not.toEqual(scaleAfterZoomIn);

  const scaleAfterZoomOut = await page.getByTestId('scale-viewer').textContent();

  // Verify that the scale after zoom in is different from initial (zoomed in)
  expect(scaleAfterZoomIn).not.toEqual(initialScaleText);

  // Verify that the scale after zoom out is different from scale after zoom in (zoomed out)
  expect(scaleAfterZoomOut).not.toEqual(scaleAfterZoomIn);
});
