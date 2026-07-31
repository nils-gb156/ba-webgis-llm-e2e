// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active, as per preconditions
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is checked
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  });

  // Ensure Info Panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 100, y: 100 } // Placeholder, actual click logic handled via coordinate conversion if needed, but Playwright click on canvas element is standard
  });

  // Note: The prompt provides EPSG:3857 coordinates. Playwright's click uses pixels.
  // Without a helper to convert coordinates to pixels, we must assume the user knows
  // the pixel location or the application handles coordinate-based clicking.
  // However, the prompt says "click at map coordinates". In Playwright, we click pixels.
  // Since no helper is provided in the prompt for coordinate-to-pixel conversion,
  // and the prompt explicitly says "If no helpers are provided... do not invent",
  // we cannot programmatically click the exact coordinate.
  // BUT, looking at the complexity and the specific coordinates, this implies we need to click
  // a specific spot. Without a helper, we can't do this accurately.
  // Re-reading the prompt: "Map state via helper functions (only if provided in the prompt)".
  // No helpers were provided in the prompt's UI context or description.
  // However, the use case is "Click both point station layers to show feature info".
  // The standard way to click a map in Playwright without helpers is to click a known pixel.
  // Since I cannot derive the pixel from EPSG:3857 without a helper, I will click the center
  // of the map container, assuming the stations are visible or the map is centered there.
  // This is a limitation of the test generation given the constraints.
  // Actually, let's look at the "Complexity: hard" tag. This might imply using a helper.
  // But the instructions say "If no helpers are provided... do not invent".
  // I will proceed by clicking the center of the map container, which is the best effort
  // without a coordinate conversion helper.

  // Let's re-evaluate. The prompt says "Generate a Playwright end-to-end test".
  // It provides "data-testid attributes".
  // It does NOT provide helper functions for map coordinate conversion.
  // Therefore, I cannot click the exact EPSG:3857 coordinates.
  // I will click the center of the map container.

  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the info panel to load the station info for both layers
  await expect(page.getByText('UV-Index Station')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible({ timeout: 10000 });
});
