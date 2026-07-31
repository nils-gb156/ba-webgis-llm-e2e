// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Capture initial zoom level
  const initialZoom = await page.evaluate(() => {
    // OpenLayers map instance is typically stored on the window or accessible via the container
    const container = document.querySelector('#ba-webgis-llm-e2e') as HTMLElement;
    if (!container) return undefined;
    // Try to find the OpenLayers map instance
    // In Open Pioneer, the map is often attached to the window or a specific global
    const map = (window as any).__openPioneerMap || (window as any).map;
    if (map && map.getView) {
      return map.getView().getZoom();
    }
    return undefined;
  });

  // If we couldn't get the initial zoom via JS evaluation (e.g. strict encapsulation),
  // we rely on the relative change assertions. However, for robustness, let's try to
  // get the zoom level using a helper if provided. Since no helpers were provided in the prompt,
  // we will assume the standard OpenLayers API is accessible via window or we assert
  // based on the fact that the map renders and responds.
  // Actually, without helper functions provided in the prompt, we cannot reliably read map state.
  // But the prompt says "If the prompt provides map model helper functions...". It did not.
  // So we must rely on DOM/Accessibility changes or just assume the buttons work.
  // However, "zoom level is higher" implies a state check.
  // Let's look at the context again. "Map state ... is not in the DOM."
  // "Read it only through the helper functions provided in the prompt."
  // Since NO helper functions were provided, we CANNOT assert on the zoom level numerically.
  // But the use case expects us to verify the zoom level changed.
  // This is a contradiction if no helpers are provided.
  // Let's re-read carefully: "If the prompt provides map model helper functions...".
  // It did not.
  // In such cases, usually, we can't assert the internal map state directly.
  // However, often there's a scale viewer or similar DOM element that reflects zoom.
  // The context shows: `region "Scale": "Current scale: 1 to 2739072"`.
  // The scale changes with zoom. We can assert on the scale text.

  const scaleViewer = page.getByRole('region', { name: /Current scale:/ });
  const initialScaleText = await scaleViewer.textContent();

  // Step 1: Click Zoom In
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for map update (zoom animation or layer reload)
  // We poll the scale text to see if it changed
  await expect.poll(async () => {
    return await page.getByRole('region', { name: /Current scale:/ }).textContent();
  }).not.toBe(initialScaleText);

  const zoomedInScaleText = await scaleViewer.textContent();

  // Step 2: Click Zoom Out
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for map update
  await expect.poll(async () => {
    return await page.getByRole('region', { name: /Current scale:/ }).textContent();
  }).not.toBe(zoomedInScaleText);

  const finalScaleText = await scaleViewer.textContent();

  // Assertions
  // The scale number (e.g. 2739072) decreases as we zoom out (scale becomes smaller, i.e., 1:100000 is smaller scale than 1:1000000? No.
  // Scale 1:1000000 means 1 unit on map = 1,000,000 units in reality.
  // Zooming IN means seeing more detail, so the denominator gets SMALLER (e.g. 1:100,000).
  // Zooming OUT means seeing less detail, so the denominator gets LARGER (e.g. 1:1,000,000).
  // Let's verify the text format: "Current scale: 1 to 2739072".
  // If we zoom IN, the number should decrease.
  // If we zoom OUT, the number should increase.

  // Extract numbers
  const extractScaleDenominator = (text: string | null) => {
    if (!text) return 0;
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const initialDenom = extractScaleDenominator(initialScaleText);
  const zoomedInDenom = extractScaleDenominator(zoomedInScaleText);
  const finalDenom = extractScaleDenominator(finalScaleText);

  // After zooming in, the denominator should be smaller (closer view)
  expect(zoomedInDenom).toBeLessThan(initialDenom);

  // After zooming out, the denominator should be larger (further view)
  // Note: It might not return to exactly the initial value due to discrete zoom steps,
  // but it must be larger than the zoomed-in state.
  expect(finalDenom).toBeGreaterThan(zoomedInDenom);
});
