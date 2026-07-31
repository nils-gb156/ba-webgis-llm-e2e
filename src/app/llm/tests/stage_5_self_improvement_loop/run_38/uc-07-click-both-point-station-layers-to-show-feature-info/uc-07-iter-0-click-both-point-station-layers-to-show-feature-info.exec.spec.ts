// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is NOT active (it may be toggled on by default).
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates where both station types overlap.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 50, y: 50 },
  });

  // The GetFeatureInfo response may take a moment to arrive and render.
  // Wait until the map shows a highlight marker, confirming the click was processed.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the info panel to load feature information.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
