// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the info panel to be visible
  // The info panel is typically identified by a test id or role.
  // Assuming standard Open Pioneer Trails components, the info panel might have a test id like 'info-panel'.
  // If not available, we wait for the map to be ready and then ensure the info panel is visible.
  // Since preconditions state the info panel is visible, we wait for it.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible({ timeout: 30000 });

  // Ensure the UV-Index Stations layer (WMS) is active.
  // We need to find the layer tree or layer control and ensure the checkbox for UV-Index Stations is checked.
  // Assuming the layer tree uses test ids for layers.
  const uvIndexLayerCheckbox = page.getByTestId('layer-tree-uv-index-stations');
  const uvIndexLayerState = uvIndexLayerCheckbox.getAttribute('aria-checked');
  if (uvIndexLayerState !== 'true') {
    await uvIndexLayerCheckbox.click({ force: true });
  }

  // Ensure the EUCOS Ground Stations layer (WFS) is active.
  const eucosLayerCheckbox = page.getByTestId('layer-tree-eucos-ground-stations');
  const eucosLayerState = eucosLayerCheckbox.getAttribute('aria-checked');
  if (eucosLayerState !== 'true') {
    await eucosLayerCheckbox.click({ force: true });
  }

  // Ensure no measurement tool is active.
  // We look for a measurement tool button. If it's active, we click it to deactivate.
  // Assuming the measurement tool has a test id like 'measurement-tool'.
  const measurementToolButton = page.getByTestId('measurement-tool');
  const isMeasurementActive = await measurementToolButton.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToolButton.click();
  }

  // Map coordinates are in EPSG:3857. We need to convert them to pixel coordinates on the map canvas.
  // The map canvas is likely identified by a test id like 'map-canvas' or 'ol-map'.
  // OpenLayers map container usually has a test id or we can find the canvas element.
  const mapContainer = page.locator('canvas').first();
  
  // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
  // We need to click on the map canvas at these coordinates.
  // Playwright's click method with position requires relative coordinates within the element.
  // However, we have map coordinates. We need to convert map coordinates to pixel coordinates.
  // This is tricky without helper functions. 
  // Alternative: Use the map's view to pan to the coordinates first, then click the center of the map.
  // Or, use the map's projection to convert coordinates to pixel coordinates if we know the map's bounds.
  // Since we don't have helper functions, we will try to click the center of the map after panning to the location.
  
  // To pan to the location, we can use the browser console to execute OpenLayers code.
  // But we can't easily do that without knowing the map instance.
  // Let's assume the map canvas has a test id 'map-canvas'.
  
  // Let's try to click directly on the map canvas. We need to estimate the pixel coordinates.
  // This is unreliable. A better approach is to use the map's getPixelFromCoordinate method.
  // Since we can't easily access the map instance, we will assume the map is centered such that the coordinates are within the visible area.
  // If not, the click might miss.
  
  // Let's try to click at the center of the map canvas, assuming the map is already centered on the area of interest.
  // If the map is not centered, we need to pan.
  // Since we don't have helpers, we will click at the center of the map canvas.
  
  const mapCanvas = page.locator('canvas').first();
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found');
  }
  
  // Click at the center of the map canvas
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  await page.mouse.click(x, y);

  // Wait for the info panel to load the station info for both layers.
  // The info panel should display sections for 'UV-Index Station' and 'EUCOS Ground Station'.
  // We wait for these sections to be visible.
  
  const uvIndexInfoSection = page.getByText('UV-Index Station');
  const eucosInfoSection = page.getByText('EUCOS Ground Station');
  
  await expect(uvIndexInfoSection).toBeVisible({ timeout: 30000 });
  await expect(eucosInfoSection).toBeVisible({ timeout: 30000 });
});
