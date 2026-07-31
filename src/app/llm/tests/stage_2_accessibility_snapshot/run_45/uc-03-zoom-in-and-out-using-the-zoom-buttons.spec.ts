// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  // Helper to get current zoom level via the map container's internal state
  // Since we don't have explicit helper functions provided in the prompt,
  // we will rely on the scale viewer or simply assert visibility of UI changes.
  // However, zoom level is not directly in DOM. We can use the scale viewer
  // as a proxy for zoom changes, or assert that the map canvas changes.
  // The prompt says "Map state ... is NOT represented as DOM elements".
  // But it also says "scale-viewer" is a data-testid. Let's check if scale changes.
  // Actually, the prompt says "scale-viewer" is available. Let's try to read it.
  // But wait, the accessibility tree shows: region "Scale": "Current scale: 1 to 2739072"
  // This text is likely inside the scale-viewer element.

  const scaleViewer = page.getByTestId('scale-viewer');
  
  // Get initial scale text
  const initialScaleText = await scaleViewer.textContent();
  expect(initialScaleText).toContain('1 to');

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await zoomInButton.click();

  // Wait for zoom to complete and scale to update
  // We poll the scale viewer until the scale number changes (scale denominator decreases when zooming in)
  await expect.poll(async () => {
    const text = await scaleViewer.textContent();
    return text;
  }).not.toEqual(initialScaleText);

  const zoomedInScaleText = await scaleViewer.textContent();
  
  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await zoomOutButton.click();

  // Wait for zoom to complete and scale to update again
  await expect.poll(async () => {
    const text = await scaleViewer.textContent();
    return text;
  }).not.toEqual(zoomedInScaleText);

  const zoomedOutScaleText = await scaleViewer.textContent();

  // Verify that zooming out resulted in a different scale than after zooming in.
  // We cannot easily compare numerical values without parsing, but we can assert
  // that the scale changed from the zoomed-in state.
  // To be more precise, we can check if the scale denominator is larger (zoomed out)
  // than it was when zoomed in.
  // However, since we don't have a helper, we just assert that the state changed.
  // A more robust check for "lower zoom level" is hard without parsing the scale string.
  // But we can assert that the scale text is different from the zoomed-in state.
  expect(zoomedOutScaleText).not.toEqual(zoomedInScaleText);

  // Optional: Verify that the scale denominator is larger (meaning lower zoom)
  // Scale format is "1 to <number>". Lower zoom = larger number.
  const extractScaleDenominator = (text: string): number => {
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const initialDenominator = extractScaleDenominator(initialScaleText);
  const zoomedInDenominator = extractScaleDenominator(zoomedInScaleText);
  const zoomedOutDenominator = extractScaleDenominator(zoomedOutScaleText);

  // Zooming in should decrease the denominator (closer view)
  expect(zoomedInDenominator).toBeLessThan(initialDenominator);
  
  // Zooming out from the zoomed-in state should increase the denominator
  expect(zoomedOutDenominator).toBeGreaterThan(zoomedInDenominator);
});
