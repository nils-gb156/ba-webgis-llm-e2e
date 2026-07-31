// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // The info panel is expected to be visible as per preconditions
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure both layers are active.
  // We assume the layers are toggled on via the layer control.
  // If they are not active, we need to activate them.
  // However, the precondition states they ARE active.
  // To be safe, we can try to verify or ensure they are active if there's a UI for it.
  // Since the prompt implies the state is pre-conditioned, we proceed to click the map.
  // But often in E2E, preconditions are about the initial state or need to be set up.
  // Let's assume the layers are visible in the layer list and checked.
  // If we need to click to activate them, we would do so here.
  // Given "hard" complexity and specific coordinates, the main action is the click.

  // Locate the map canvas. The map is rendered on a canvas.
  // We need to click at specific coordinates relative to the map container.
  // The coordinates are in EPSG:3857 (Web Mercator).
  // We need to convert these to pixel coordinates on the map canvas.
  // However, Playwright's `click` with `position` option clicks relative to the element's top-left corner.
  // We need to know the map's view extent and size to convert EPSG:3857 coordinates to pixels.
  // Alternatively, if the application provides a way to click by coordinates, we would use it.
  // Since it's a standard OpenLayers map, we might need to calculate the pixel position.
  // Let's assume we can get the map container and calculate the position.
  // A simpler approach for E2E if the exact pixel conversion is hard is to find a known feature or use the helper if provided.
  // No helper is provided in the prompt.
  // Let's try to find the map container. Usually it's a div with a specific class or test id.
  // Let's assume the map container has a test id 'map' or similar. If not, we might need to use a role or text.
  // OpenLayers maps often have a container with class 'ol-viewport' or similar.
  // Let's try to locate the map container by its test id if available, or by role.
  // If no test id, we might use `page.locator('canvas')` but that might be ambiguous.
  // Let's assume there is a map container with test id 'map-container' or similar.
  // If not specified, we might need to infer. Let's try to find the canvas.
  
  // Wait for the map canvas to be present
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map canvas
  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // Convert EPSG:3857 coordinates to pixel coordinates on the map canvas.
  // This requires knowing the map's current view (center, zoom, resolution).
  // Without a helper, this is difficult.
  // However, the prompt says "Click at map coordinates [1188692.84, 6767643.28]".
  // Let's assume the map is centered such that these coordinates are visible.
  // We can try to click at a relative position if we can estimate it.
  // Alternatively, we can use the `page.mouse.click` with screen coordinates if we can convert.
  // But `position` on `click` is relative to the element.
  
  // Let's try a different approach. If the application has a geocoder or search, we could search for the station.
  // But the use case specifically says "click at map coordinates".
  
  // Let's assume we can get the map's view parameters from the application state if we had a helper.
  // Since we don't, we might need to rely on the fact that the coordinates are within the visible area.
  // Let's try to click at the center of the map and hope it's close, or use a known offset.
  // This is risky.
  
  // Let's re-read the prompt. "Click at map coordinates [1188692.84, 6767643.28]".
  // This is a specific coordinate.
  // In many E2E tests, if the exact coordinate click is required, the test environment might have a fixed map state.
  // Let's assume the map is loaded and the coordinates are visible.
  // We can try to convert the coordinates to pixel coordinates if we know the map's extent.
  // Let's assume the map's center is at [1188692.84, 6767643.28] for simplicity, or that the click will work if we click near the center.
  // But this is an assumption.
  
  // A better approach: Use the `page.mouse.click` with screen coordinates.
  // First, convert EPSG:3857 to screen coordinates.
  // This requires the map's view.
  // Let's try to get the map's view from the DOM or application state.
  // Without a helper, this is hard.
  
  // Let's try to use the `position` option on the map canvas click.
  // We need to calculate the pixel offset.
  // Let's assume the map's center is at [0,0] for a moment to estimate.
  // This is not reliable.
  
  // Let's try to find if there is a test id for the map or a way to interact with it.
  // If not, we might need to use a workaround.
  // Let's assume the map container has a test id 'map'.
  const mapContainer = page.getByTestId('map').first();
  await expect(mapContainer).toBeVisible();
  
  // Get the bounding box of the map container
  const mapContainerBox = await mapContainer.boundingBox();
  if (!mapContainerBox) {
    throw new Error('Map container bounding box not found');
  }

  // We need to convert the EPSG:3857 coordinates to pixel coordinates relative to the map container.
  // This requires the map's view.
  // Let's try to get the map's view from the application's global state or a specific element.
  // If we can't, we might need to use a known feature's location.
  // Let's try to click at the center of the map container and hope the coordinates are there.
  // This is not robust.
  
  // Let's try to use the `page.evaluate` to get the map's view and convert coordinates.
  // This requires the map instance to be available in the browser context.
  // In OpenLayers, the map instance is usually stored in a global variable or accessible via the container.
  // Let's try to get the map instance.
  const pixel = await page.evaluate(({ x, y, containerBox }) => {
    // Try to get the OpenLayers map instance
    // In many applications, the map is stored in a global variable or on the window object.
    // Let's try to find it.
    const map = (window as any).olMap || (window as any).map;
    if (!map) {
      // Try to get the map from the container
      // OpenLayers stores the map instance on the container element
      const container = document.querySelector('[data-testid="map"]') as HTMLElement;
      if (container && container.olMap) {
        return container.olMap.getCoordinateFromPixel([containerBox.width / 2, containerBox.height / 2]);
      }
      return null;
    }
    // If we have the map, we can convert the coordinate to pixel
    // But we need the pixel from the coordinate, not the other way around.
    // We have the coordinate [1188692.84, 6767643.28] and we want the pixel.
    // We need to know the map's view to do this.
    // Let's assume the map's view is accessible.
    const view = map.getView();
    if (!view) {
      return null;
    }
    const resolution = view.getResolution();
    const center = view.getCenter();
    const rotation = view.getRotation();
    
    // Convert EPSG:3857 to pixel
    // This is a simplified conversion. In reality, OpenLayers uses a projection.
    // Let's use OpenLayers' built-in conversion if possible.
    // map.getCoordinateFromPixel returns coordinate from pixel.
    // We need the reverse.
    // There is no direct method in OL to get pixel from coordinate without knowing the view.
    // But we have the view.
    // Let's try to use the view's projection.
    const projection = view.getProjection();
    const pixel = map.getPixelFromCoordinate([x, y]);
    return pixel;
  }, { x: 1188692.84, y: 6767643.28, containerBox: mapContainerBox });

  if (!pixel) {
    throw new Error('Could not convert coordinate to pixel');
  }

  // Click at the calculated pixel position on the map container
  await mapContainer.click({
    position: {
      x: pixel[0],
      y: pixel[1]
    }
  });

  // Wait for the info panel to update with feature info
  // The info panel should now show 'UV-Index Station' and 'EUCOS Ground Station' sections
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
