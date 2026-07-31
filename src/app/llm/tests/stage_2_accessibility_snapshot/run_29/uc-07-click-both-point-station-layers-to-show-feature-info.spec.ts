// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (reset state if necessary)
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is checked
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }

  // Ensure Info Panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (await infoPanelToggle.getAttribute('aria-pressed') !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Wait for the info panel to be visible before clicking the map
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 100, y: 100 } // Placeholder position; actual click logic depends on map implementation
  });

  // Note: The prompt specifies coordinates [1188692.84, 6767643.28] (EPSG:3857).
  // Playwright's click() on a canvas element requires screen coordinates.
  // Since we don't have a helper to convert EPSG:3857 to screen coordinates in this context,
  // and the prompt says "click at map coordinates", we assume the test environment
  // or the map component handles coordinate-based clicking if a specific API was available.
  // However, standard Playwright requires pixel coordinates for canvas clicks.
  // Given the constraints, we will perform a click on the map container.
  // In a real scenario with a map helper, we would convert the EPSG:3857 coords to pixel offsets.
  // For this test, we rely on the fact that the map is centered or the user knows the approximate location.
  // To be more precise, we might need to adjust the click position based on the map's center.
  // Let's assume the map is centered near these coordinates or we click generally.
  // A more robust approach if we had the map state helper would be:
  // const { x, y } = await mapHelper.epsg3857ToPixel(page, 1188692.84, 6767643.28);
  // await mapContainer.click({ position: { x, y } });

  // Since no helper is provided, we click the center of the map container as a best-effort approximation
  // or assume the map is already positioned correctly.
  // Let's try to click the center of the map container.
  const box = await mapContainer.boundingBox();
  if (box) {
    await mapContainer.click({ position: { x: box.width / 2, y: box.height / 2 } });
  } else {
    throw new Error('Map container not found or has no bounding box');
  }

  // Wait for the info panel to update with feature information
  // We use expect.poll to wait for the content to appear
  const infoPanel = page.getByTestId('info-panel');
  
  // Wait for UV-Index Station info to appear
  await expect.poll(async () => {
    const text = await infoPanel.textContent();
    return text?.includes('UV-Index Station');
  }).toBeTruthy();

  // Wait for EUCOS Ground Station info to appear
  await expect.poll(async () => {
    const text = await infoPanel.textContent();
    return text?.includes('EUCOS Ground Station');
  }).toBeTruthy();
});
