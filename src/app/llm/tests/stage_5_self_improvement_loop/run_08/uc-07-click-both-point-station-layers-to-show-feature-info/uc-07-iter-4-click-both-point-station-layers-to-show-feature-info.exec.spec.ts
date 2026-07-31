// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel visible, both station layers active
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Click on the map at the specified coordinates where both stations overlap.
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load feature info for both layers.
  // The info panel should display a 'UV-Index Station' section and an 'EUCOS Ground Station' section.
  // We use expect.poll because the info panel content is loaded asynchronously.
  await expect.poll(() =>
    page.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible(),
  ).toBeTruthy();

  await expect.poll(() =>
    page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible(),
  ).toBeTruthy();

  // Additionally, verify that the map highlight moved to the clicked coordinate.
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([1188692.84, 6767643.28]);
});
