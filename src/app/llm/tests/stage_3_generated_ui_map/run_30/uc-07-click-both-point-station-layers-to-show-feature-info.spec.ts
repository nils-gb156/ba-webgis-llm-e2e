// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and layers are rendered before interacting
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure measurement tool is not active (toggle it off if necessary)
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to update with feature information
  // The info panel content is dynamic, so we poll for the presence of the specific section texts
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUvi = await infoPanel.getByText('UV-Index Station').isVisible();
    const hasEucos = await infoPanel.getByText('EUCOS Ground Station').isVisible();
    return { hasUvi, hasEucos };
  }).toEqual({ hasUvi: true, hasEucos: true });
});
