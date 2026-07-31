// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // The map container is typically the main canvas or a specific div.
  // We assume the info panel is visible as per preconditions, but we wait for initial load.
  await expect(page.locator('canvas')).toBeVisible();

  // Ensure no measurement tool is active.
  // We look for a measurement tool button/panel and ensure it's not active.
  // If there's a specific test id for the measurement tool, use it.
  // Otherwise, we assume the default state is fine or check for absence of active measurement UI.
  // Let's assume there might be a measurement panel or active indicator.
  // If the preconditions say "No measurement tool is active", we just proceed.
  // However, to be safe, we might want to ensure the map is in default state.
  // Since we can't easily "deactivate" without knowing the UI, we rely on the precondition.

  // Ensure layers are active.
  // We need to find the layer list and ensure UV-Index Stations and EUCOS Ground Stations are checked.
  // Let's assume there are test ids for the layer checkboxes.
  // If not, we use getByRole.

  // Check UV-Index Stations layer
  const uvIndexLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Station', exact: true });
  if (!(await uvIndexLayerCheckbox.isChecked())) {
    await uvIndexLayerCheckbox.click();
  }

  // Check EUCOS Ground Stations layer
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Station', exact: true });
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click();
  }

  // Wait for layers to be active and potentially loaded
  // We can wait for a short time or check for layer presence if possible.
  // Since map state is not in DOM, we rely on network responses or just proceed.
  // Let's wait for the map to be ready by checking if the canvas is interactive or similar.
  // For now, we just proceed to click.

  // Click on the map at the specified coordinates
  // The coordinates are in EPSG:3857.
  // We need to click on the map canvas.
  // The map canvas is usually the first canvas element or has a specific test id.
  // Let's assume the map container has a test id or we can use the canvas.
  // We need to convert EPSG:3857 coordinates to pixel coordinates on the canvas.
  // However, Playwright's click with position option takes relative coordinates to the element.
  // We need to know the map's center, zoom, and size to calculate the pixel position.
  // Alternatively, if there is a helper function provided, we would use it.
  // Since no helper is provided in the prompt, we must calculate or use a known strategy.
  // Wait, the prompt says "If the prompt provides map model helper functions...".
  // It does NOT provide any. So we cannot use helper functions.
  // This is a problem. How do we click at specific EPSG:3857 coordinates without helpers?
  // Usually, in such E2E tests, if helpers are not provided, we might need to use the map's API or
  // we might need to calculate the pixel coordinates.
  // However, calculating pixel coordinates from EPSG:3857 requires knowing the map's current view.
  // Let's assume the map is in a known initial state or we can get the view.
  // But without helpers, we can't get the view.
  // Let's re-read the prompt.
  // "If the prompt provides map model helper functions...".
  // It does not.
  // So we must use a different approach.
  // Maybe the coordinates are relative to the map container? No, they are EPSG:3857.
  // This seems impossible without helpers or a way to get the map's current projection/center/zoom.
  // Let's assume there is a way to get the map instance or that the test environment provides a way.
  // Or, perhaps, the test should use the map's click event with coordinates?
  // Playwright's `click` with `position` is relative to the element's top-left corner.
  // We need to convert EPSG:3857 to pixel coordinates.
  // Let's assume we can get the map's center and zoom from the URL or some other source.
  // Or, maybe the test is expected to fail if helpers are not provided?
  // No, that's not right.
  // Let's look for a workaround.
  // Maybe the map has a test id and we can use JavaScript to get the pixel coordinates?
  // We can use `page.evaluate` to call OpenLayers methods to get the pixel coordinates.
  // Let's try that.

  // Get the map element
  const mapElement = page.locator('canvas').first();
  await expect(mapElement).toBeVisible();

  // Calculate pixel coordinates from EPSG:3857
  // We need to get the map instance. In Open Pioneer, the map might be attached to the window or a specific element.
  // Let's assume we can get the map from the window or a global variable.
  // This is fragile.
  // Alternatively, we can use the `page.evaluate` to get the pixel coordinates using OpenLayers' `getPixelFromCoordinate`.
  // But we need the map instance.
  // Let's assume the map is available as `window.map` or similar.
  // This is a guess.
  // Let's try to find the map instance by looking for a common pattern.
  // In many Open Pioneer apps, the map is stored in a store or on the window.
  // Let's assume `window.pioneer.map` or similar.
  // If we can't find it, we might need to use a different approach.
  // For now, let's assume we can get the map instance.

  // Let's try to get the pixel coordinates using JavaScript
  const pixelCoords = await page.evaluate(
    async ({ x, y }) => {
      // Try to find the map instance
      // This is a heuristic and might not work in all cases
      const map = (window as any).pioneer?.map || (window as any).map;
      if (!map) {
        throw new Error('Map instance not found');
      }
      // Convert EPSG:3857 to pixel coordinates
      // OpenLayers' getPixelFromCoordinate expects a coordinate in the map's projection
      // Assuming the map uses EPSG:3857
      const pixel = map.getPixelFromCoordinate([x, y]);
      return { x: pixel[0], y: pixel[1] };
    },
    { x: 1188692.84, y: 6767643.28 }
  );

  // Click on the map at the calculated pixel coordinates
  await mapElement.click({
    position: {
      x: pixelCoords.x,
      y: pixelCoords.y
    }
  });

  // Wait for the info panel to load the station info for both layers
  // We need to assert that the info panel contains sections for both layers.
  // Let's assume the info panel has test ids or specific structure.
  // Let's look for 'UV-Index Station' and 'EUCOS Ground Station' in the info panel.
  // We can use getByText or getByRole.

  // Wait for UV-Index Station info
  await expect(page.getByText('UV-Index Station')).toBeVisible();

  // Wait for EUCOS Ground Station info
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();

  // Additional assertions to ensure the info is actually displayed
  // We can check for specific feature information if available.
  // For now, we just check for the section titles.
});
