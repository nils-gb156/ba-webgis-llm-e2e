// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  if (await infoPanelToggle.getAttribute('aria-pressed') !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Wait for the info panel to be visible before clicking
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  // We need to click the map container at a position that corresponds to these coordinates.
  // Since we don't have a helper to convert coordinates to pixel positions,
  // we will use the provided map-container test id and click on it.
  // The test expects the info panel to show feature info for both layers.
  // We will use the map-container's bounding box to calculate a position if needed,
  // but for now, we will click on the map container.
  // To be more precise, we can use the map-container's bounding box and click in the center,
  // assuming the map is centered on the target coordinates.
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    // Fallback if bounding box is not available
    await page.click('[data-testid="map-container"]');
  }

  // Wait for the feature info to load
  // The info panel should contain sections for both 'UV-Index Station' and 'EUCOS Ground Station'.
  // We will use getByTestId('info-panel') to scope our search to the info panel.
  await expect.poll(() => page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBe(true);
  await expect.poll(() => page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBe(true);
});
