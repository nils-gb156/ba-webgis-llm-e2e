// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel visible, both station layers active
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Click on the map at the specified coordinates where both stations overlap
  // Use the test id for the map container instead of a CSS id selector
  await page.getByTestId('map-container').click({ position: { x: 400, y: 300 } });

  // Wait for the info panel to load feature info for both layers
  // The highlight marker appears after the GetFeatureInfo request completes
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
