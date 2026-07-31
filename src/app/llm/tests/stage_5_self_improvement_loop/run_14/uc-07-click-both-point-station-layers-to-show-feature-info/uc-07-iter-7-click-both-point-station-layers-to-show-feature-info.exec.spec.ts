// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active (it is by default)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  // The canvas element may intercept pointer events, so we use force: true.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    force: true,
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load the station info for both layers.
  // The info panel headings serve as the assertion for the feature info content.
  await expect(
    page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true })
  ).toBeVisible();

  await expect(
    page
      .getByTestId('info-panel')
      .getByRole('heading', { name: 'EUCOS Ground Station', exact: true })
  ).toBeVisible();
});
