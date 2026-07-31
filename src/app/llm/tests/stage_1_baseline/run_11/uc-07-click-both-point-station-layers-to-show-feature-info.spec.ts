// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the info panel to be visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure the UV-Index Stations layer is active
  // Assuming the layer list item has a test id for the UV-Index Stations layer
  const uvLayerToggle = page.getByTestId('layer-list-item-uv-index-stations').getByRole('checkbox');
  if (!(await uvLayerToggle.isChecked())) {
    await uvLayerToggle.click({ force: true });
  }

  // Ensure the EUCOS Ground Stations layer is active
  // Assuming the layer list item has a test id for the EUCOS Ground Stations layer
  const eucosLayerToggle = page.getByTestId('layer-list-item-eucos-ground-stations').getByRole('checkbox');
  if (!(await eucosLayerToggle.isChecked())) {
    await eucosLayerToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates
  // The map canvas is typically identified by a test id or role.
  // We will use the map container test id if available, otherwise fall back to role.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to update with feature info for both layers
  // We expect to see sections for both 'UV-Index Station' and 'EUCOS Ground Station'
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
