// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it intercepts map clicks)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the map is ready before interacting
  await expect.poll(() => getMapCenter(page)).toBeDefined();
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Get the current map state to calculate pixel offset
  const center = await getMapCenter(page);
  const zoom = await getMapZoomLevel(page);

  // Calculate the resolution (meters per pixel) at the current zoom level
  // OpenLayers uses a resolution of 156543.03392804097 at zoom level 0
  const resolution = 156543.03392804097 / Math.pow(2, zoom!);

  // Get the map container dimensions
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  const canvasWidth = box!.width;
  const canvasHeight = box!.height;

  // Target coordinates in EPSG:3857
  const targetX = 1188692.84;
  const targetY = 6767643.28;

  // Convert map coordinates to pixel coordinates relative to the map container
  // Formula: pixel = (mapCoord - centerCoord) / resolution + canvasCenter
  const pixelX = (targetX - center![0]) / resolution + canvasWidth / 2;
  const pixelY = (targetY - center![1]) / resolution + canvasHeight / 2;

  // Click on the map at the calculated pixel coordinates
  // force: true is used because the map is a canvas and may intercept pointer events
  await mapContainer.click({
    position: { x: pixelX, y: pixelY },
    force: true,
  });

  // Wait for the info panel to load feature information for both layers
  // Use expect.poll to handle the asynchronous loading of feature info
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uviHeading = infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true });
    const eucosHeading = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true });
    const uviVisible = await uviHeading.isVisible();
    const eucosVisible = await eucosHeading.isVisible();
    return { uviVisible, eucosVisible };
  }).toEqual({ uviVisible: true, eucosVisible: true });
});
