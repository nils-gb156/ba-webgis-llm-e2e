// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level from the application state
  const getZoomLevel = async (page) => {
    // We need to access the map instance to get the zoom level.
    // Assuming the map instance is available on the window object or through a specific test helper.
    // Since no specific helper was provided in the prompt for map state, we will use a generic approach
    // by checking if there's a way to query the zoom. However, Playwright tests usually rely on
    // visual cues or specific test APIs.
    // Given the complexity of accessing internal map state without a provided helper,
    // and the instruction to use provided helpers if available, we must assume standard DOM assertions
    // or specific test IDs if available for zoom level.
    // Since no test ID for zoom level is provided, we will verify the buttons are clickable and
    // the map responds. However, the expected result explicitly mentions zoom level changes.
    // Let's look for a scale viewer or similar that might reflect zoom changes.
    // The accessibility tree shows a "Scale" region with "Current scale: 1 to ...".
    // Scale changes with zoom. We can assert on the scale text.

    const scaleText = await page.getByRole('region', { name: 'Scale' }).textContent();
    return scaleText;
  };

  // Get initial scale
  const initialScale = await getZoomLevel(page);

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to complete and scale to update
  // Zooming takes some time, so we poll for the scale to change
  await expect.poll(async () => {
    const currentScale = await getZoomLevel(page);
    return currentScale !== initialScale;
  }).toBeTruthy();

  const scaleAfterZoomIn = await getZoomLevel(page);

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to complete and scale to update again
  await expect.poll(async () => {
    const currentScale = await getZoomLevel(page);
    return currentScale !== scaleAfterZoomIn;
  }).toBeTruthy();

  const scaleAfterZoomOut = await getZoomLevel(page);

  // Expected results:
  // 1. After zoom in, zoom level is higher (scale denominator is smaller, e.g., 1:1000 vs 1:2000)
  //    The scale text is "Current scale: 1 to X". A higher zoom level means a smaller X.
  // 2. After zoom out, zoom level is lower than after zooming in (scale denominator is larger)

  // Extract the denominator from the scale string "Current scale: 1 to X"
  const extractDenominator = (scaleStr: string | null): number | null => {
    if (!scaleStr) return null;
    const match = scaleStr.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const initialDenominator = extractDenominator(initialScale);
  const zoomInDenominator = extractDenominator(scaleAfterZoomIn);
  const zoomOutDenominator = extractDenominator(scaleAfterZoomOut);

  // Assert zoom in decreased the scale denominator (higher zoom)
  expect(zoomInDenominator).toBeLessThan(initialDenominator!);

  // Assert zoom out increased the scale denominator (lower zoom) compared to zoom in state
  expect(zoomOutDenominator).toBeGreaterThan(zoomInDenominator!);
});
