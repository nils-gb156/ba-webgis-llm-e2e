// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition checks: verify both station layers are active/rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Precondition: info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: no measurement tool is active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: Click at the specified map coordinates on the map canvas
  await page.getByTestId('map-container').click({
    position: { x: 500, y: 300 },
  });

  // Wait for the map highlight to appear at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Step 2: Wait for the info panel to load feature info for both layers
  // The info panel should display sections for both "UV-Index Station" and "EUCOS Ground Station"
  const infoPanel = page.getByTestId('info-panel');

  // Wait for the UV-Index Station section to appear
  await expect.poll(() => infoPanel.getByText('UV-Index Station').isVisible()).toBe(true);

  // Wait for the EUCOS Ground Station section to appear
  await expect.poll(() => infoPanel.getByText('EUCOS Ground Station').isVisible()).toBe(true);
});
