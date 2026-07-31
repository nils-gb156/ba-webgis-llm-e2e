// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it might be toggled on by default in some test runs)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  if (await infoPanelToggle.getAttribute('aria-pressed') !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Wait for the map to be ready
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Wait for the info panel to be visible before clicking
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates
  await page.locator('#map-container').click({
    position: { x: 600, y: 400 },
  });

  // Wait for the feature info to load
  await expect.poll(() => page.getByText('UV-Index Station').isVisible()).resolves.toBe(true);
  await expect.poll(() => page.getByText('EUCOS Ground Station').isVisible()).resolves.toBe(true);
});
