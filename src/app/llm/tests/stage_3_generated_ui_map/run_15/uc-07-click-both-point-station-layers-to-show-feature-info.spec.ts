// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure measurement tool is inactive
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click();
  }

  // Ensure UV-Index Stations layer is rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Ensure EUCOS Ground Stations layer is rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28,
    },
  });

  // Wait for the info panel to load the station info for both layers
  // We check for the presence of text indicating the sections exist
  // The exact text might vary, so we look for the section headers or key terms
  await expect.poll(() =>
    page.getByTestId('info-panel').locator('text=UV-Index Station').first().isVisible()
  ).toBe(true);

  await expect.poll(() =>
    page.getByTestId('info-panel').locator('text=EUCOS Ground Station').first().isVisible()
  ).toBe(true);
});
