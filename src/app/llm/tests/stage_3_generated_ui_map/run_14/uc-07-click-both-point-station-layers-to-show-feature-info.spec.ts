// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanelVisible = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelVisible !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is active
  if (!(await expect.poll(() => isLayerRendered(page, 'UV-Index Stations'))).toBe(true)) {
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcherVisible = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (layerSwitcherVisible !== 'true') {
      await layerSwitcherToggle.click({ force: true });
    }

    const uvIndexStationCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    const isChecked = await uvIndexStationCheckbox.isChecked();
    if (!isChecked) {
      await uvIndexStationCheckbox.click({ force: true });
    }
  }

  // Ensure EUCOS Ground Stations layer is active
  if (!(await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations'))).toBe(true)) {
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcherVisible = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (layerSwitcherVisible !== 'true') {
      await layerSwitcherToggle.click({ force: true });
    }

    const eucosStationCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const isChecked = await eucosStationCheckbox.isChecked();
    if (!isChecked) {
      await eucosStationCheckbox.click({ force: true });
    }
  }

  // Ensure no measurement tool is active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 500, y: 500 }
  });

  // Wait for the info panel to load the station info for both layers
  await expect.poll(() => page.getByTestId('coordinate-viewer').textContent()).toBeTruthy();
  await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeFalsy();

  // Check that the info panel displays a 'UV-Index Station' section with feature information
  const uvIndexStationSection = page.getByRole('region', { name: 'UV-Index Station' });
  await expect(uvIndexStationSection).toBeVisible();

  // Check that the info panel displays an 'EUCOS Ground Station' section with feature information
  const eucosStationSection = page.getByRole('region', { name: 'EUCOS Ground Station' });
  await expect(eucosStationSection).toBeVisible();
});
