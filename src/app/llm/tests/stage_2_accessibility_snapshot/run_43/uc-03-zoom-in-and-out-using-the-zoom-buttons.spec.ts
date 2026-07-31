// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the zoom buttons to be visible
  await expect(page.getByRole('button', { name: 'Zoom in map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out map' })).toBeVisible();

  // Get initial zoom level
  const initialZoom = await page.locator('#map-container').evaluate((mapEl: any) => {
    // Assuming OpenLayers map instance is accessible via a property or we can infer from scale
    // Since we don't have helpers, we'll use the scale viewer as a proxy for zoom level
    // Higher zoom = larger scale denominator (smaller ratio like 1:1000 vs 1:1000000)
    // Actually, zoom level increases as you zoom in.
    // Let's rely on the scale viewer text which changes.
    // "Current scale: 1 to 2739072" -> 2739072 is the denominator.
    // Zoom in -> denominator decreases.
    // Zoom out -> denominator increases.
    const scaleText = page.locator('[aria-label="Scale"]').textContent();
    return scaleText;
  });

  // Step 1: Click Zoom In
  await page.getByRole('button', { name: 'Zoom in map' }).click();

  // Wait for zoom action to complete and scale to update
  await expect(page.locator('[aria-label="Scale"]')).toHaveText(/Current scale: 1 to \d+/);

  // Get zoomed in scale
  const zoomedInScaleText = await page.locator('[aria-label="Scale"]').textContent();
  
  // Extract denominator from "Current scale: 1 to X"
  const initialDenominator = parseInt(initialZoom.match(/1 to (\d+)/)?.[1] || '0', 10);
  const zoomedInDenominator = parseInt(zoomedInScaleText.match(/1 to (\d+)/)?.[1] || '0', 10);

  // Verify zoom level is higher (denominator is smaller)
  expect(zoomedInDenominator).toBeLessThan(initialDenominator);

  // Step 2: Click Zoom Out
  await page.getByRole('button', { name: 'Zoom out map' }).click();

  // Wait for zoom action to complete and scale to update
  await expect(page.locator('[aria-label="Scale"]')).toHaveText(/Current scale: 1 to \d+/);

  // Get zoomed out scale
  const zoomedOutScaleText = await page.locator('[aria-label="Scale"]').textContent();
  const zoomedOutDenominator = parseInt(zoomedOutScaleText.match(/1 to (\d+)/)?.[1] || '0', 10);

  // Verify zoom level is lower (denominator is larger than after zooming in)
  expect(zoomedOutDenominator).toBeGreaterThan(zoomedInDenominator);
});
