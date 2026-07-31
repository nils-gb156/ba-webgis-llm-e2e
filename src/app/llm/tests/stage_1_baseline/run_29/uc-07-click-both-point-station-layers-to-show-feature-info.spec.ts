// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure UV-Index Stations layer is active
  const uvIndexLayerToggle = page.getByTestId('layer-toggle-uv-index-stations');
  const uvIndexLayerState = await uvIndexLayerToggle.getAttribute('aria-checked');
  if (uvIndexLayerState !== 'true') {
    await uvIndexLayerToggle.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is active
  const eucosLayerToggle = page.getByTestId('layer-toggle-eucos-ground-stations');
  const eucosLayerState = await eucosLayerToggle.getAttribute('aria-checked');
  if (eucosLayerState !== 'true') {
    await eucosLayerToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates
  const mapCanvas = page.locator('canvas.ol-viewport');
  await mapCanvas.click({
    position: {
      x: 1188692.84,
      y: 6767643.28,
    },
  });

  // Wait for and verify UV-Index Station info in the info panel
  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Wait for and verify EUCOS Ground Station info in the info panel
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
