// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and layers are rendered as per preconditions
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 400,
      y: 300
    }
  });

  // Wait for the info panel to update with feature information
  // We poll for the presence of the expected sections in the info panel
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUviSection = await infoPanel.getByText('UV-Index Station').isVisible();
    const hasEcosSection = await infoPanel.getByText('EUCOS Ground Station').isVisible();
    return { hasUviSection, hasEcosSection };
  }).toEqual({ hasUviSection: true, hasEcosSection: true });
});
