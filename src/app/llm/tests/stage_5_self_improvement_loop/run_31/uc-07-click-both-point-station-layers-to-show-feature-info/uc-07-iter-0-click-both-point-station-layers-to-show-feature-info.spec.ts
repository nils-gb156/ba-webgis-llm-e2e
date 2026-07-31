// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure both station layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the specified coordinates
  await page.locator('#map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to display feature information for both station types
  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
