// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: Ensure no measurement tool is active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Ensure both station layers are rendered (active)
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click on the map at the specified coordinates
  const targetX = 1188692.84;
  const targetY = 6767643.28;
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: targetX, y: targetY } });

  // Step 2: Wait for the info panel to load feature information for both layers
  // The feature info is loaded asynchronously, so we poll the text content.
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('EUCOS Ground Station');

  // Verify the map highlight appeared at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([targetX, targetY]);
});
