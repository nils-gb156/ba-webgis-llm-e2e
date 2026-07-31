// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial zoom level to be established
  const initialZoom = await page.evaluate(() => {
    // Assuming a global or window property exposes the OpenLayers map instance
    // This is a common pattern in such applications. If not available, we rely on DOM
    // or other indicators. However, without specific helper functions provided in the prompt,
    // we must infer map state or rely on the fact that the map is rendered.
    // Since we cannot assert map zoom via DOM directly, and no helper was provided,
    // we will assume the test validates the *action* of clicking the buttons.
    // However, the expected result requires verifying zoom level changes.
    // Without a provided helper, this is challenging.
    // Let's look for a scale viewer which might reflect zoom changes.
    const scaleViewer = page.locator('[data-testid="scale-viewer"]');
    // We can't easily extract the numeric zoom from the scale text reliably across different scales.
    // Let's try to find if there's a global map object.
    const map = (window as any).map;
    if (map) {
      return map.getView().getZoom();
    }
    return null;
  });

  // If no global map object is found, we might need to rely on visual cues or assume the
  // application exposes map state in a way we can poll.
  // Given the constraints, let's assume the map object is available on window for testing purposes
  // or we use the scale viewer as a proxy for zoom change (less precise).
  // However, the most robust way without helpers is if the app exposes it.
  // Let's try to poll the scale viewer text to see if it changes, which correlates with zoom.
  
  // Initial state check: ensure zoom buttons are visible
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  // Get initial scale to compare against
  const initialScaleText = await page.locator('[data-testid="scale-viewer"]').textContent();

  // Step 1: Click Zoom in
  await zoomInButton.click();

  // Wait for zoom to settle and scale to update
  await expect.poll(async () => {
    const scaleText = await page.locator('[data-testid="scale-viewer"]').textContent();
    return scaleText;
  }).not.toBe(initialScaleText);

  const zoomedInScaleText = await page.locator('[data-testid="scale-viewer"]').textContent();

  // Step 2: Click Zoom out
  await zoomOutButton.click();

  // Wait for zoom to settle and scale to update back (or to a new value)
  await expect.poll(async () => {
    const scaleText = await page.locator('[data-testid="scale-viewer"]').textContent();
    return scaleText;
  }).not.toBe(zoomedInScaleText);

  const finalScaleText = await page.locator('[data-testid="scale-viewer"]').textContent();

  // Expected results:
  // After zoom in, scale should be different (typically larger denominator for smaller scale/zoomed out? 
  // Wait, "Zoom in" means closer, so scale denominator usually decreases (e.g. 1:1000 -> 1:500).
  // "Zoom out" means further, so scale denominator increases.
  // Let's parse the scale text "1 to X".
  const parseScale = (text: string | null): number => {
    if (!text) return 0;
    const match = text.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const initialScaleValue = parseScale(initialScaleText);
  const zoomedInScaleValue = parseScale(zoomedInScaleText);
  const finalScaleValue = parseScale(finalScaleText);

  // Zoom in: scale denominator should decrease (map is closer, so 1 unit represents fewer real-world units)
  // Actually, standard cartographic scale: 1:10,000 is zoomed in compared to 1:1,000,000.
  // So zooming in -> denominator decreases.
  expect(zoomedInScaleValue).toBeLessThan(initialScaleValue);

  // Zoom out: scale denominator should increase.
  // It should be lower than the zoomed-in value, but potentially higher than initial if we didn't zoom out fully to initial.
  // The requirement says: "After clicking the 'Zoom out' button, the map zoom level is lower than after zooming in."
  // Lower zoom level means further away, so larger denominator.
  expect(finalScaleValue).toBeGreaterThan(zoomedInScaleValue);
});
