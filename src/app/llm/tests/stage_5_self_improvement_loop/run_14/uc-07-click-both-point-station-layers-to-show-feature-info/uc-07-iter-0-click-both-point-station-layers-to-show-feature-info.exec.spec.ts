// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is by default, but we assert it)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active (it is by default, but we assert it)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates where both station layers overlap
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 600, y: 300 } });

  // Wait for the info panel to load the station info for both layers
  // We use expect.poll to wait for the feature info to appear
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUVIStation = await infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible();
    const hasEUCOSStation = await infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible();
    return { hasUVIStation, hasEUCOSStation };
  }).toEqual({ hasUVIStation: true, hasEUCOSStation: true });

  // Verify that the info panel displays a 'UV-Index Station' section with feature information
  await expect(page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Verify that the info panel displays an 'EUCOS Ground Station' section with feature information
  await expect(page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
