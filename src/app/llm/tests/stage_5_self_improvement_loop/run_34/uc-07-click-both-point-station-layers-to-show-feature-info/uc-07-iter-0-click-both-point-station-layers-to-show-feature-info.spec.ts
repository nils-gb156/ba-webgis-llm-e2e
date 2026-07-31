// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure info panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');

  if (!await infoPanel.isVisible()) {
    await infoPanelToggle.click({ force: true });
  }
  await expect(infoPanel).toBeVisible();

  // Precondition: Ensure measurement tool is NOT active
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Ensure UV-Index Stations and EUCOS Ground Stations are active
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });

  if (!await uvIndexCheckbox.isChecked()) {
    await uvIndexCheckbox.click({ force: true });
  }
  if (!await eucosCheckbox.isChecked()) {
    await eucosCheckbox.click({ force: true });
  }

  // Step 1: Click at the specified map coordinates
  // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 500, y: 300 }
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // We expect to see sections for both UV-Index Station and EUCOS Ground Station
  
  // Wait for a highlight to appear, indicating the click was processed
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for and verify the UV-Index Station info section
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  
  // Wait for and verify the EUCOS Ground Station info section
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
