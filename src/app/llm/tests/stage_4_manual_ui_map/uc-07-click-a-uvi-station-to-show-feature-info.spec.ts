// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../map-model-helpers';

test('Use Case 7: Click a UVI station to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure UV-Index Stations layer is rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Precondition: Ensure info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Click on the UVI station marker at specific coordinates
  const stationX = 1188692.84;
  const stationY = 6767643.28;

  // Register listener for the GetFeatureInfo request before clicking
  const getFeatureInfoRequest = page.waitForRequest((request) => {
    const url = request.url();
    return url.includes('GetFeatureInfo') && url.includes('UV-Index Stations');
  });

  // Click on the map at the specific coordinates
  await page.locator('canvas').click({
    position: {
      x: stationX,
      y: stationY,
    },
  });

  // Wait for the GetFeatureInfo request to be sent
  const request = await getFeatureInfoRequest;
  expect(request.url()).toContain('GetFeatureInfo');

  // Step 2: Wait for the info panel to load the station info
  // The uvi-station-section becomes visible when feature info is loaded
  await expect(page.getByTestId('uvi-station-section')).toBeVisible();

  // Verify that the UVI station info content is present
  await expect(page.getByTestId('uvi-station-info')).toBeVisible();

  // Verify that a highlight marker appears on the map at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
});
