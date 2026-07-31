// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get initial zoom level
  // We need to extract zoom from the URL hash or query params, or use a helper if provided.
  // Since no helper is provided, we will rely on the fact that zoom changes are reflected
  // in the map's internal state. However, without a helper, we cannot directly assert the zoom number.
  // We can assert that the map view changes by checking if features move or by using the scale bar.
  // The scale bar text changes with zoom. Let's use the scale viewer as a proxy for zoom level.
  
  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // Capture initial scale text
  const initialScaleText = await scaleViewer.textContent();

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to complete. The scale text should change.
  // Zooming in means the scale denominator decreases (e.g., from 1:2739072 to 1:1369536).
  // We wait for the scale text to be different from the initial one.
  await expect.poll(async () => {
    return await scaleViewer.textContent();
  }).not.toBe(initialScaleText);

  const zoomedInScaleText = await scaleViewer.textContent();

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to complete. The scale text should change again.
  await expect.poll(async () => {
    return await scaleViewer.textContent();
  }).not.toBe(zoomedInScaleText);

  // Expected Result: After clicking 'Zoom out', the zoom level is lower than after zooming in.
  // This means the scale denominator should be larger than it was after zooming in.
  // We can't easily parse the scale text "1 to 2739072" to compare numerically without regex.
  // However, we can assert that the final state is different from the zoomed-in state.
  // To strictly follow "zoom level is lower than after zooming in", we can compare the scale denominators.
  
  const finalScaleText = await scaleViewer.textContent();
  
  // Extract denominator from scale text "Current scale: 1 to <number>"
  const extractDenominator = (text: string | null): number => {
    if (!text) return 0;
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const initialDenom = extractDenominator(initialScaleText);
  const zoomedInDenom = extractDenominator(zoomedInScaleText);
  const finalDenom = extractDenominator(finalScaleText);

  // Zoom in: denominator decreases
  expect(zoomedInDenom).toBeLessThan(initialDenom);

  // Zoom out: denominator increases compared to zoomed in
  expect(finalDenom).toBeGreaterThan(zoomedInDenom);
});
