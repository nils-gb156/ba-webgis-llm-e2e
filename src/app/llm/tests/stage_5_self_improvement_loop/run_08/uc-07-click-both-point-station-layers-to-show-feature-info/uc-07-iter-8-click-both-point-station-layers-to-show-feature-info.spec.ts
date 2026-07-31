// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel visible, both station layers active
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Click on the map at the specified coordinates where both stations overlap.
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  // Use force: true because the Chakra UI map container intercepts pointer events.
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
    force: true,
  });

  // Wait for the info panel to load feature info for both layers.
  // The info panel should display a 'UV-Index Station' section and an 'EUCOS Ground Station' section.
  // We use expect.poll because the info panel content is loaded asynchronously.
  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station' }).isVisible(),
  ).toBeTruthy();

  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible(),
  ).toBeTruthy();
});
