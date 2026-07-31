// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and layers to be fully loaded.
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Verify measurement tool is not active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  // Click on the map canvas at the specified coordinates.
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to display feature information for both layers.
  await expect.poll(() =>
    page.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible()
  ).toBe(true);
  await expect.poll(() =>
    page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible()
  ).toBe(true);

  // Assert that a highlight marker was placed on the map at the clicked location.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
