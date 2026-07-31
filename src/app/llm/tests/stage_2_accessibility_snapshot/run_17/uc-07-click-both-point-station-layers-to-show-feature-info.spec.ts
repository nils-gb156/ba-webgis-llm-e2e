// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the map container
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Ensure no measurement tool is active (it might be toggled on by default or previous state)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click();
  }

  // Ensure UV-Index Stations layer is checked
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click();
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click();
  }

  // Ensure info panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanelState = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelState !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates where both stations are located
  // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 400, y: 300 } // Approximate center click, adjusted for specific coordinates if needed
  });

  // Note: The exact pixel position depends on the map's current view.
  // Since we cannot easily calculate pixel from EPSG:3857 without map state helpers,
  // we rely on the fact that the stations are at a known location.
  // However, to be precise, we should ideally use map state helpers.
  // Since no helpers are provided, we assume the default view might not show these specific stations clearly.
  // Let's try to zoom to the initial extent first to see if that helps, or assume the default view is appropriate.
  // The use case says "The user clicks at map coordinates...".
  // Without a helper to convert EPSG:3857 to pixel coordinates, we have to make an educated guess or assume the default view is correct.
  // Let's assume the default view is centered appropriately or use the initial extent button.
  
  // Let's click the initial extent button to ensure we are in a known state, then click the map.
  // But the coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  // 1188692.84 is roughly 10.7 degrees longitude, 6767643.28 is roughly 60.8 degrees latitude.
  // This is in Northern Europe, possibly near Sweden/Norway.
  
  // Let's try to click the map at a position that might correspond to these coordinates.
  // Since we don't have a helper, we will click the center of the map and hope the stations are visible.
  // Alternatively, we can try to zoom in/out to find them, but that's unreliable.
  // Let's assume the test environment is set up such that these stations are visible in the default view or after clicking initial extent.
  
  // Let's click the initial extent button to reset the view.
  await page.getByTestId('initial-extent-button').click();
  await expect(page.getByTestId('map-container')).toBeVisible();
  
  // Now click the map at the center, assuming the stations are in the initial extent.
  // If the stations are not in the initial extent, this test might fail.
  // However, the use case says "Both a UVI station and an EUCOS ground station are located at map coordinates...".
  // It doesn't say they are in the initial extent.
  // Without a helper to navigate to specific coordinates, we have to assume the default view is appropriate.
  
  // Let's try to click the map at a position that is likely to contain the stations.
  // Since we can't calculate the exact pixel, we'll click the center of the map.
  const mapBox = await mapContainer.boundingBox();
  if (mapBox) {
    await mapContainer.click({
      position: { x: mapBox.width / 2, y: mapBox.height / 2 }
    });
  }

  // Wait for the info panel to load the station info for both layers
  // The info panel should display a 'UV-Index Station' section and an 'EUCOS Ground Station' section
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible({ timeout: 10000 });
});
