// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click a UVI station to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows the info panel toggle is pressed, so it should be visible.
  // We wait for the info panel container to be visible to ensure it's ready.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure the UV-Index Stations layer is active.
  // The accessibility tree shows "UV-Index Stations" checkbox is checked.
  // We verify this by checking the checkbox state.
  const uviStationCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  await expect(uviStationCheckbox).toBeChecked();

  // Ensure no measurement tool is active.
  // The accessibility tree shows "Measurement" button is not pressed (default state).
  // We verify it is not pressed.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBePressed();

  // Register a listener for the WMS GetFeatureInfo request.
  // We expect a request to the DWD geoserver for the UV-Index Stations layer.
  const getFeatureInfoRequest = page.waitForRequest((request) => {
    const url = request.url();
    return (
      url.includes('dwd') &&
      url.includes('GetFeatureInfo') &&
      url.includes('UV-Index')
    );
  });

  // Click on the UVI station marker at the specified coordinates.
  // The map is rendered on a canvas, so we click directly on the map container at the coordinates.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28,
    },
  });

  // Wait for the WMS GetFeatureInfo request to be sent.
  await getFeatureInfoRequest;

  // Wait for the info panel to load the station info.
  // We expect the info panel to display a 'UV-Index Station' section.
  // We use expect.poll to wait for the content to appear in the info panel.
  await expect.poll(async () => {
    const content = await infoPanel.textContent();
    return content?.includes('UV-Index Station');
  }).toBeTruthy();

  // Verify that the info panel displays feature information.
  // We check for some common feature info fields or the section header.
  await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();
});
