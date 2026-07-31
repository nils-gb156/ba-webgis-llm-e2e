// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting with it
  await page.waitForSelector('[data-testid="map-container"]');

  // Get the initial zoom level to verify changes
  const initialZoom = await page.evaluate(() => {
    // Access the OpenLayers map instance which is typically attached to the window or found in the DOM
    // Open Pioneer Trails usually exposes the map via a global or we can query the map object
    // Since we don't have explicit helpers, we'll rely on the scale viewer or map state if available.
    // However, the prompt says map state is not in DOM. Let's try to get the map instance.
    // In many Open Pioneer apps, the map is available on the window or we can find it.
    // Let's assume we can get the zoom from the map object if exposed, or we can infer from scale.
    // For robustness, let's try to get the zoom level from the OpenLayers map instance.
    // If not exposed globally, we might need to rely on the scale viewer text.
    // Let's try to get the map instance first.
    const map = (window as any).__openPioneerMap || (window as any).map;
    if (map) {
      return map.getView().getZoom();
    }
    return null;
  });

  // If we can't get the zoom level directly, we can use the scale viewer as a proxy
  // But let's try to get the zoom level first. If it's null, we'll fallback to scale viewer.
  const useScaleViewer = initialZoom === null;

  if (useScaleViewer) {
    // Fallback to scale viewer text
    const initialScaleText = await page.getByTestId('scale-viewer').textContent();
    expect(initialScaleText).toBeTruthy();
    // Extract the scale number from "Current scale: 1 to 2739072"
    const match = initialScaleText?.match(/1 to (\d+)/);
    const initialScaleValue = match ? parseInt(match[1], 10) : 0;

    // Step 1: Click the 'Zoom in' button
    const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
    await zoomInButton.click();

    // Wait for the scale to update
    await expect.poll(async () => {
      const scaleText = await page.getByTestId('scale-viewer').textContent();
      const match = scaleText?.match(/1 to (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).toBeLessThan(initialScaleValue);

    const zoomedInScale = await page.evaluate(() => {
      const scaleText = document.querySelector('[data-testid="scale-viewer"]')?.textContent;
      const match = scaleText?.match(/1 to (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    // Step 2: Click the 'Zoom out' button
    const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
    await zoomOutButton.click();

    // Wait for the scale to update
    await expect.poll(async () => {
      const scaleText = await page.getByTestId('scale-viewer').textContent();
      const match = scaleText?.match(/1 to (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).toBeGreaterThan(zoomedInScale);

  } else {
    // Use direct zoom level if available
    const initialZoomLevel = initialZoom as number;

    // Step 1: Click the 'Zoom in' button
    const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
    await zoomInButton.click();

    // Wait for the zoom level to change
    const zoomedInZoom = await expect.poll(async () => {
      const map = (window as any).__openPioneerMap || (window as any).map;
      if (map) {
        return map.getView().getZoom();
      }
      return initialZoomLevel; // Return initial if map not found
    }).toBeGreaterThan(initialZoomLevel);

    // Step 2: Click the 'Zoom out' button
    const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
    await zoomOutButton.click();

    // Wait for the zoom level to change back down
    await expect.poll(async () => {
      const map = (window as any).__openPioneerMap || (window as any).map;
      if (map) {
        return map.getView().getZoom();
      }
      return zoomedInZoom; // Return zoomed in if map not found
    }).toBeLessThan(zoomedInZoom);
  }
});
