// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level from the scale viewer or map state
  // Since we don't have explicit map helper functions in the prompt, we'll infer zoom changes
  // by checking the scale viewer text which typically updates with zoom.
  // Alternatively, we can click and check for map interaction, but scale is a good proxy.
  // However, the prompt says "Map state ... is NOT represented as DOM elements".
  // But the accessibility tree shows: region "Scale": "Current scale: 1 to 2739072"
  // So we can use the scale viewer to assert zoom changes.

  const scaleViewer = page.getByTestId('scale-viewer');
  
  // Get initial scale text to establish a baseline
  const initialScaleText = await scaleViewer.textContent();
  expect(initialScaleText).toBeTruthy();

  // Step 1: Click the 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom action to complete and scale to update
  // We poll the scale viewer to ensure it has changed
  await expect.poll(async () => {
    const currentScale = await scaleViewer.textContent();
    return currentScale;
  }).not.toBe(initialScaleText);

  // Step 2: Click the 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom action to complete and scale to update again
  await expect.poll(async () => {
    const currentScale = await scaleViewer.textContent();
    return currentScale;
  }).not.toBe(await scaleViewer.textContent()); // Ensure it changed at least once more

  // Verify that the scale changed after zooming out compared to after zooming in
  // Since we can't easily compare numeric values from the string "1 to X", 
  // we just assert that the scale changed from the previous state.
  // To strictly verify "lower than after zooming in", we would need numeric zoom levels.
  // However, the use case expects: "After clicking the 'Zoom out' button, the map zoom level is lower than after zooming in."
  // Without a numeric zoom helper, we rely on the fact that clicking zoom out changes the scale.
  // Let's capture the scale after zoom in.
  
  // Re-evaluating: The prompt says "Map state ... is NOT represented as DOM elements".
  // But scale viewer IS in the DOM.
  // Let's assume the scale value changes monotonically with zoom.
  // Zoom in -> Scale denominator decreases (e.g. 1:1000000 -> 1:500000)
  // Zoom out -> Scale denominator increases (e.g. 1:500000 -> 1:1000000)
  
  // Let's capture the scale after zoom in
  const scaleAfterZoomIn = await scaleViewer.textContent();
  
  // Click zoom out
  await zoomOutButton.click();
  
  // Get scale after zoom out
  const scaleAfterZoomOut = await scaleViewer.textContent();
  
  // Extract numbers from scale string "1 to X"
  const extractScaleDenominator = (scaleText: string | null): number => {
    if (!scaleText) return 0;
    const match = scaleText.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const denomAfterZoomIn = extractScaleDenominator(scaleAfterZoomIn);
  const denomAfterZoomOut = extractScaleDenominator(scaleAfterZoomOut);

  // Zoom in should result in a smaller denominator (higher zoom)
  // Zoom out should result in a larger denominator (lower zoom) than after zoom in
  expect(denomAfterZoomIn).toBeLessThan(extractScaleDenominator(initialScaleText));
  expect(denomAfterZoomOut).toBeGreaterThan(denomAfterZoomIn);
});
