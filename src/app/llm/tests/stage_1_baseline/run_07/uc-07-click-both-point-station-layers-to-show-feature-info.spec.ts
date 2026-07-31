// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the info panel to be visible
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Ensure the info panel is visible.
  // The info panel is typically rendered when feature info is available or explicitly toggled.
  // We wait for it to be visible before proceeding.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible({ timeout: 10000 });

  // Click on the map at the specified coordinates [1188692.84, 6767643.28]
  // We need to find the map container to click on. Usually, the canvas is inside a specific container.
  // We will click directly on the canvas element at the relative position corresponding to the coordinates.
  // However, Playwright's click with position requires a bounding box.
  // A more robust way for map interactions in Playwright is to use the map's internal coordinate system if exposed,
  // or click on the canvas element. Since we don't have a specific helper for coordinate conversion in this prompt,
  // we will assume the canvas covers the map area and click on it.
  // Note: Without a helper to convert EPSG:3857 to pixel coordinates, we might need to rely on the map's internal logic
  // if it exposes an API, or we might need to approximate.
  // Given the "hard" complexity and the specific coordinates, let's try to click on the canvas.
  // We'll get the bounding box of the canvas and click at a position that *might* correspond to the coordinates.
  // But this is fragile. Let's look for a better way.
  // Often, map libraries expose a method to get pixel from lon/lat.
  // Since we don't have access to that, we will click on the canvas.
  // We need to ensure the map is centered such that these coordinates are visible.
  // The preconditions state that stations are at these coordinates, implying they are visible or the map is zoomed in enough.
  // Let's click on the canvas. We'll use a central position if we can't determine the exact pixel.
  // However, the use case specifies exact coordinates.
  // Let's assume the map canvas is the primary interactive element.
  const boundingBox = await mapCanvas.boundingBox();
  if (!boundingBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // We will click on the canvas. Since we don't have a helper to convert EPSG:3857 to pixels,
  // we will click on the canvas. The application should handle the coordinate click if the map is configured to listen to clicks.
  // In many OpenLayers setups, clicking on the map triggers a GetFeatureInfo request.
  // We will click on the center of the canvas as a fallback, but ideally, we should click at the specific pixel.
  // Without a helper, we cannot precisely convert EPSG:3857 to pixel coordinates.
  // However, the prompt mentions "Map state via helper functions (only if provided in the prompt)".
  // No helpers are provided in the prompt.
  // Therefore, we must rely on the map's ability to handle clicks.
  // We will click on the canvas. The application might be configured to show feature info for the layers at the clicked location.
  // We will click on the canvas.
  await mapCanvas.click({ force: true });

  // Wait for the info panel to update with feature info for both layers.
  // We will wait for the info panel to contain text for both 'UV-Index Station' and 'EUCOS Ground Station'.
  // We will use expect.poll to wait for the content to appear.

  // Check for UV-Index Station info
  await expect.poll(async () => {
    const uvSection = page.getByRole('heading', { name: 'UV-Index Station', exact: true }).first();
    if (uvSection) {
      const isVisible = await uvSection.isVisible();
      return isVisible;
    }
    return false;
  }).toBe(true, { timeout: 10000 });

  // Check for EUCOS Ground Station info
  await expect.poll(async () => {
    const eucosSection = page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).first();
    if (eucosSection) {
      const isVisible = await eucosSection.isVisible();
      return isVisible;
    }
    return false;
  }).toBe(true, { timeout: 10000 });
});
