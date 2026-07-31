// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be present and ready for interaction
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Click at the specified coordinates [1188692.84, 6767643.28] on the map canvas
  await mapCanvas.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to update with feature information for both layers.
  // We poll for the presence of the specific section headers to ensure the async
  // GetFeatureInfo responses have been processed and rendered.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Assert that the UV-Index Station section is present
  await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();

  // Assert that the EUCOS Ground Station section is present
  await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
