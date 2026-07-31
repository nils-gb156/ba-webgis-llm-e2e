// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and default layers to be rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible (it is visible by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates where both stations are located
  await page.locator('#map-container').click({
    position: { x: 0, y: 0 },
  });

  // Wait for the feature info requests to complete and the info panel to update.
  // We wait for the UV-Index Station info to appear.
  await expect.poll(async () => {
    const uviSection = page.getByTestId('uvi-station-section');
    const eucosSection = page.getByTestId('eucos-station-section');
    const uviVisible = await uviSection.isVisible();
    const eucosVisible = await eucosSection.isVisible();
    return { uvi: uviVisible, eucos: eucosVisible };
  }).toEqual({ uvi: true, eucos: true });

  // Assert that the UV-Index Station section is visible and contains info
  await expect(page.getByTestId('uvi-station-section')).toBeVisible();
  await expect(page.getByTestId('uvi-station-info')).toBeVisible();

  // Assert that the EUCOS Ground Station section is visible and contains info
  await expect(page.getByTestId('eucos-station-section')).toBeVisible();
  await expect(page.getByTestId('eucos-station-info')).toBeVisible();
});
