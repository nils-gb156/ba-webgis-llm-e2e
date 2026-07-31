// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready.
  // We assume the layers are active by default or need to be activated.
  // The prompt says "The UV-Index Stations layer (WMS) is active" and "The EUCOS Ground Stations layer (WFS) is active" as preconditions.
  // We need to ensure these layers are indeed active.
  // Since we don't have helper functions for layer visibility in the prompt, we rely on UI interaction or assume default state.
  // However, to be robust, we should check if they are active.
  // Let's assume the layers are toggled via checkboxes in the layer list.
  // We will try to locate the layer list and ensure the layers are checked.
  // If the test fails because layers are not active, we might need to activate them.
  // But the prompt says they are active as preconditions. Let's proceed with clicking the map.
  // If the info panel is not visible, we might need to open it. The prompt says "The info panel is visible".

  // Wait for the map canvas to be visible
  const mapCanvas = page.locator('canvas.ol-map');
  await expect(mapCanvas).toBeVisible();

  // Wait for the info panel to be visible as per precondition
  // Assuming the info panel has a test id or can be located by role/text.
  // Common test id for info panel might be 'info-panel' or similar.
  // Let's try to find it by role or a common selector.
  // If no test id is known, we might use a generic locator.
  // Let's assume there is a container for the info panel.
  const infoPanel = page.locator('[data-testid="info-panel"]').or(page.getByRole('region', { name: /Info Panel/i }));
  await expect(infoPanel).toBeVisible();

  // Ensure no measurement tool is active.
  // This might require clicking a 'default' or 'select' tool if a measurement tool is active.
  // Without specific UI details, we assume the default state is correct or that clicking the map doesn't trigger measurement.
  // If there's a specific "Select" tool, we might need to click it.
  // Let's assume the default interaction mode is correct.

  // Click on the map at the specified coordinates [1188692.84, 6767643.28]
  // We need to get the bounding box of the map canvas to calculate the position.
  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // The coordinates are in EPSG:3857 (Web Mercator).
  // We need to convert them to pixel coordinates relative to the map canvas.
  // However, Playwright's click method with `position` expects coordinates relative to the element's top-left corner.
  // We need to convert the EPSG:3857 coordinates to pixel coordinates on the map.
  // This usually requires access to the map's projection or a helper function.
  // Since no helper functions are provided, we might need to use a different approach.
  // Alternatively, if the application provides a way to click on the map via coordinates, we could use that.
  // But typically, we click on the canvas element at a specific pixel position.
  // Let's assume we can calculate the pixel position from the EPSG:3857 coordinates.
  // This is complex without a helper.
  // Another approach: Use the map's `getPixelFromCoordinate` method if exposed, but it's not in the DOM.
  // Let's try to find a test id for the map interaction or a tool that allows coordinate input.
  // If none, we might have to estimate or use a known point.
  // However, the prompt specifies exact coordinates.
  // Let's assume there is a way to click on the map at these coordinates.
  // In many webgis apps, clicking on the map triggers a GetFeatureInfo request.
  // We can wait for the GetFeatureInfo response to confirm the click was successful.

  // Let's try to click on the map canvas at a position that corresponds to the coordinates.
  // We need to convert EPSG:3857 to pixel coordinates.
  // This conversion depends on the map's extent and zoom level.
  // Without a helper, this is difficult.
  // Let's assume the map is centered and zoomed such that we can estimate the position.
  // Alternatively, we can use the map's `getPixelFromCoordinate` if we can access the map object via JS evaluation.
  // Let's try to evaluate JS to get the pixel position.

  const pixelPosition = await page.evaluate(
    async (canvas) => {
      // Try to access the OpenLayers map instance
      // OpenLayers stores the map instance on the canvas element or in a global variable
      // This is implementation-specific.
      // Let's try to find the map instance via the canvas's OL map property if available
      // Or via a global variable like `map` or `window.map`
      
      // A common pattern in OpenLayers is to have the map instance accessible via the canvas's `olMap` property or similar
      // Let's try to find it
      const map = (canvas as any).olMap || (canvas as any).getMap?.();
      
      if (!map) {
        // Fallback: try global variables
        return null;
      }

      const coordinate = [1188692.84, 6767643.28]; // EPSG:3857
      const view = map.getView();
      const projection = view.getProjection();
      
      // Convert coordinate to pixel
      const pixel = map.getPixelFromCoordinate(coordinate);
      
      // Calculate relative position to the canvas
      const canvasRect = canvas.getBoundingClientRect();
      const x = pixel[0] - canvasRect.left;
      const y = pixel[1] - canvasRect.top;
      
      return { x, y };
    },
    mapCanvas.firstElement() as HTMLElement
  );

  if (!pixelPosition) {
    // If we can't get the pixel position, we might need to use a different strategy.
    // For now, let's assume we can click on the map canvas at a rough position.
    // This is not ideal, but without helper functions, it's the best we can do.
    // Let's try to click on the center of the map canvas.
    // This might not hit the exact feature, but it will trigger a GetFeatureInfo request.
    // We can then check if the info panel contains the expected data.
    // However, the prompt specifies exact coordinates.
    // Let's try to use the map's `getPixelFromCoordinate` via JS evaluation again, but with a different approach.
    
    // Let's try to find the map instance via the document's OL maps
    const mapInstance = await page.evaluate(() => {
      // OpenLayers might store maps in a global array or object
      // This is highly implementation-specific
      return (window as any).openPioneer?.map?.getMap?.() || (window as any).map;
    });

    if (mapInstance) {
      const pixelPosition = await page.evaluate((map, canvas) => {
        const coordinate = [1188692.84, 6767643.28]; // EPSG:3857
        const pixel = map.getPixelFromCoordinate(coordinate);
        const canvasRect = canvas.getBoundingClientRect();
        const x = pixel[0] - canvasRect.left;
        const y = pixel[1] - canvasRect.top;
        return { x, y };
      }, mapInstance, mapCanvas.firstElement() as HTMLElement);

      if (pixelPosition) {
        // Click on the map at the calculated pixel position
        await mapCanvas.click({ position: pixelPosition });
      } else {
        // Fallback: click on the center of the map canvas
        await mapCanvas.click({ position: { x: mapBox.width / 2, y: mapBox.height / 2 } });
      }
    } else {
      // Fallback: click on the center of the map canvas
      await mapCanvas.click({ position: { x: mapBox.width / 2, y: mapBox.height / 2 } });
    }
  } else {
    // Click on the map at the calculated pixel position
    await mapCanvas.click({ position: pixelPosition });
  }

  // Wait for the GetFeatureInfo response to confirm the click was successful
  // The GetFeatureInfo request is typically a POST or GET request to a WMS or WFS endpoint
  // Let's wait for a response that contains 'GetFeatureInfo' or 'FeatureInfo'
  const featureInfoResponse = page.waitForResponse((response) => {
    const url = response.url();
    return url.includes('GetFeatureInfo') || url.includes('FeatureInfo') || url.includes('wfs') || url.includes('wms');
  }, { timeout: 10000 });

  await featureInfoResponse;

  // Wait for the info panel to update with the feature information
  // The info panel should display 'UV-Index Station' and 'EUCOS Ground Station' sections
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();

  // Assert that the info panel displays the expected sections
  // We can check for the presence of these texts in the info panel
  const infoPanelContent = page.locator('[data-testid="info-panel"]').or(page.getByRole('region', { name: /Info Panel/i }));
  await expect(infoPanelContent.getByText('UV-Index Station')).toBeVisible();
  await expect(infoPanelContent.getByText('EUCOS Ground Station')).toBeVisible();
});
