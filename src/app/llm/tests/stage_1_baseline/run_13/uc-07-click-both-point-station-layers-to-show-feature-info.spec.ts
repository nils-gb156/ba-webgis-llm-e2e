// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready
  // The map container is typically the main canvas or a specific div.
  // We wait for the map to be visible/interactive.
  const mapContainer = page.locator('canvas');
  await expect(mapContainer).toBeVisible();

  // Ensure no measurement tool is active (reset state if necessary, or assume clean start)
  // The prompt says "No measurement tool is active" as a precondition.
  // We assume the default state is correct, but if there's a known toggle for tools, we might need to close it.
  // For now, we proceed with the click.

  // Click on the map at the specified coordinates [1188692.84, 6767643.28] (EPSG:3857)
  // Playwright's click with position uses pixel coordinates relative to the element.
  // However, the prompt provides EPSG:3857 coordinates.
  // We need to convert these to pixel coordinates on the map canvas.
  // Since we don't have a helper function provided in the prompt for coordinate conversion,
  // and the prompt says "To interact with the map, click the map container element ... with a position option",
  // we must assume the test environment or the application provides a way to map these coordinates.
  // In many E2E setups, specific coordinates might be hardcoded if the map view is fixed.
  // Alternatively, we might need to use the map's internal coordinate system if exposed.
  // Given the "hard" complexity and lack of helper, we will attempt to click at a specific pixel location
  // that corresponds to these EPSG:3857 coordinates in the default view.
  // Without a helper, this is fragile. However, looking at the prompt's instruction:
  // "If the prompt provides map model helper functions... If no helpers are provided, this section is irrelevant"
  // There are no helpers provided.
  // We will try to find a way to click. Often, E2E tests for maps rely on known pixel offsets
  // or a specific map state. Let's assume the map is centered such that these coordinates are visible.
  // We'll try to click near the center or a known location if coordinates are unknown.
  // But the prompt is specific: "clicks at map coordinates [1188692.84, 6767643.28]".
  // Let's assume there is a way to get the pixel location. If not, we might need to use a different approach.
  // Actually, Playwright can't directly click EPSG:3857 coordinates.
  // We need to convert EPSG:3857 to pixel coordinates on the canvas.
  // Since we don't have a helper, we might have to rely on the map being in a specific state.
  // Let's look for a way to get the map instance.
  // In Open Pioneer, the map instance might be accessible via window or a global variable.
  // Let's try to access the map instance to convert coordinates.

  // Attempt to get the map instance from the window object (common in web apps)
  // This is a heuristic and might vary. If it fails, we might need to use a different locator.
  // However, the prompt says "click the map container element ... with a position option".
  // This implies we need pixel coordinates.
  // Let's assume the following conversion logic is available via the map instance.
  
  // We will try to evaluate script to get the map instance and convert coordinates.
  const pixelCoords = await page.evaluate(async () => {
    // This is a guess. The actual key might be different.
    // In Open Pioneer Trails, the map might be stored in a specific way.
    // Let's try to find the map instance.
    // Often, it's attached to the canvas element or a global.
    // Let's try to get the map from the first canvas element's parent or context.
    // This is highly application-specific.
    // If we can't find it, we might have to use a hardcoded pixel location if the view is fixed.
    // For the sake of this test, let's assume we can get the map instance.
    // We'll try to access `window.__openPioneerMap` or similar.
    // If that fails, we'll try to get it from the canvas element.
    
    // Let's try a generic approach: get the map instance from the canvas element's context if available.
    // Or, if the app exposes a global.
    
    // Since we don't know the exact global, let's try to click at a location that is likely to be the center
    // if the map is centered on the data.
    // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
    // This corresponds to a location in Europe.
    // Without a helper, we cannot accurately click this location.
    // However, the prompt says "Generate a Playwright end-to-end test".
    // It is possible that the test environment has a specific setup.
    // Let's assume we can use `page.mouse.click(x, y)` with calculated x, y.
    // But we don't have x, y.
    
    // Let's re-read the prompt.
    // "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
    // The context provided is the use case description. It doesn't provide pixel coordinates.
    // It provides EPSG:3857 coordinates.
    // This implies we need to convert them.
    // Since no helper is provided, we might need to implement the conversion or assume it's done elsewhere.
    // But we can't import helpers.
    // Let's assume there is a way to get the map instance from the page.
    
    // Let's try to get the map instance from the window object.
    // This is a common pattern in Open Pioneer apps.
    const mapInstance = (window as any).__openPioneerMap;
    if (mapInstance) {
      // Convert EPSG:3857 to pixel coordinates
      const x = 1188692.84;
      const y = 6767643.28;
      // The map instance should have a method to convert coordinates.
      // In OpenLayers, it's `getPixelFromCoordinate`.
      // Let's assume the map instance is an OpenLayers map.
      if (mapInstance.getPixelFromCoordinate) {
        const pixel = mapInstance.getPixelFromCoordinate([x, y]);
        return pixel;
      }
    }
    
    // Fallback: if we can't get the map instance, we can't click the exact location.
    // We'll return null and hope for the best, or throw an error.
    return null;
  });

  if (pixelCoords) {
    // Click the map canvas at the calculated pixel coordinates
    await page.locator('canvas').click({
      position: {
        x: pixelCoords[0],
        y: pixelCoords[1]
      }
    });
  } else {
    // If we couldn't calculate the coordinates, we'll try to click near the center of the map.
    // This is a fallback and might not trigger the feature info for the specific stations.
    // However, the test might fail if the stations are not at the center.
    // Given the "hard" complexity, this fallback is weak.
    // Let's assume the map is centered on the data and the stations are visible.
    // We'll click the center of the map canvas.
    const box = await page.locator('canvas').boundingBox();
    if (box) {
      await page.locator('canvas').click({
        position: {
          x: box.width / 2,
          y: box.height / 2
        }
      });
    }
  }

  // Wait for the info panel to load the station info for both layers.
  // The info panel is likely a div with a specific test id or role.
  // Let's assume the info panel has a test id or is identifiable by its content.
  // The prompt says "The info panel is visible" as a precondition.
  // We need to wait for the feature info to appear.
  
  // Look for the UV-Index Station section
  const uvInfoPanel = page.getByRole('region', { name: /UV-Index Station/i }).first();
  await expect(uvInfoPanel).toBeVisible({ timeout: 10000 });

  // Look for the EUCOS Ground Station section
  const eucosInfoPanel = page.getByRole('region', { name: /EUCOS Ground Station/i }).first();
  await expect(eucosInfoPanel).toBeVisible({ timeout: 10000 });

  // Assert that the feature information is displayed
  // We can check for specific text or elements within these panels.
  // The prompt doesn't specify exact text, just that the sections appear.
  // We'll assert that the panels are visible and contain some content.
  await expect(uvInfoPanel).toContainText(/.+/);
  await expect(eucosInfoPanel).toContainText(/.+/);
});
