// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: both station layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is NOT active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click();
  }

  // Click on the map at the specified coordinates.
  // The map is a canvas; the container div intercepts pointer events.
  // Using force: true bypasses the interception.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    force: true,
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load feature info for both layers.
  // Poll for the highlighted coordinate to settle (confirming the map click was processed)
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // The info panel headings use the layer titles (e.g. "UV-Index Stations")
  // Scope to the info panel to avoid ambiguity.
  const infoPanel = page.getByTestId('info-panel');
  await expect.poll(() =>
    infoPanel.getByRole('heading', { name: 'UV-Index Stations', exact: true }).isVisible()
  ).toBeTruthy();
  await expect.poll(() =>
    infoPanel.getByRole('heading', { name: 'EUCOS Ground Stations', exact: true }).isVisible()
  ).toBeTruthy();
});
