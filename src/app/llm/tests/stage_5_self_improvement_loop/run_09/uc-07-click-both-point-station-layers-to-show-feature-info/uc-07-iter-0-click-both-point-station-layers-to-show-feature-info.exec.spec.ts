// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel visible, both station layers rendered
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click at the specified coordinates on the map canvas
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load feature info for both layers
  await expect.poll(() => page.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBe(true);
  await expect.poll(() => page.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBe(true);
});
