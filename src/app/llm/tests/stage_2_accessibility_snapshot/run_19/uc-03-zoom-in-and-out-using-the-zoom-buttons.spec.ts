// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Helper to get current zoom level via the map model
  const getZoomLevel = async (page: any) => {
    // Assuming a global map instance or a way to access the OpenLayers map instance
    // Since no specific helper functions were provided in the prompt for map state,
    // we will rely on the visual feedback or a potential global variable if exposed.
    // However, the prompt says "Map state ... is NOT represented as DOM elements".
    // Without specific helper functions provided in the prompt, we cannot read zoom via helpers.
    // We must rely on the fact that zooming changes the map view.
    // Let's assume we can't directly assert zoom level without helpers.
    // But the expected result is about zoom level being higher/lower.
    // Let's check if there's any visible indicator. The scale bar changes.
    // Scale viewer: "Current scale: 1 to 2739072"
    // We can assert the scale text changes.
    return null; // Placeholder
  };

  // Since we don't have helper functions provided in the prompt for map state,
  // we will use the scale viewer text as a proxy for zoom level.
  // Higher zoom = larger scale denominator (smaller number in "1 to X" usually means closer zoom? No, 1:1000 is closer than 1:1000000).
  // Wait, "1 to 2739072" means 1 unit on map is 2739072 units in reality.
  // Zooming in means 1 unit on map is FEWER units in reality. So the denominator decreases.
  // Zooming out means 1 unit on map is MORE units in reality. So the denominator increases.

  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // Get initial scale text
  const initialScaleText = await scaleViewer.textContent();
  // Extract the denominator from "1 to X"
  const initialScaleMatch = initialScaleText?.match(/1 to (\d+)/);
  const initialDenominator = initialScaleMatch ? parseInt(initialScaleMatch[1], 10) : 0;

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to complete and scale to update
  await expect(scaleViewer).toContainText('1 to');
  
  // Get scale after zoom in
  const scaleAfterZoomInText = await scaleViewer.textContent();
  const scaleAfterZoomInMatch = scaleAfterZoomInText?.match(/1 to (\d+)/);
  const afterZoomInDenominator = scaleAfterZoomInMatch ? parseInt(scaleAfterZoomInMatch[1], 10) : 0;

  // Expected result: After clicking 'Zoom in', zoom level is higher, so denominator should be smaller
  expect(afterZoomInDenominator).toBeLessThan(initialDenominator);

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to complete and scale to update
  await expect(scaleViewer).toContainText('1 to');

  // Get scale after zoom out
  const scaleAfterZoomOutText = await scaleViewer.textContent();
  const scaleAfterZoomOutMatch = scaleAfterZoomOutText?.match(/1 to (\d+)/);
  const afterZoomOutDenominator = scaleAfterZoomOutMatch ? parseInt(scaleAfterZoomOutMatch[1], 10) : 0;

  // Expected result: After clicking 'Zoom out', zoom level is lower than after zooming in, so denominator should be larger than after zoom in
  expect(afterZoomOutDenominator).toBeGreaterThan(afterZoomInDenominator);
});
