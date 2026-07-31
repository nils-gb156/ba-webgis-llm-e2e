// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active (it is not active by default)
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates where both stations are located
  const targetX = 1188692.84;
  const targetY = 6767643.28;
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: targetX, y: targetY } });

  // Wait for the info panel to load feature information for both layers
  // The info panel should now contain sections for both 'UV-Index Station' and 'EUCOS Ground Station'
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('EUCOS Ground Station');
});
