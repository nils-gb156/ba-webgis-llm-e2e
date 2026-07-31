// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it intercepts clicks)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Wait for measurement panel to close before clicking on the map
  await expect(page.getByRole('dialog', { name: 'Measurement' })).not.toBeVisible();

  // Click on the map at the specified coordinates
  await page.getByTestId('map-container').click({
    position: { x: 0, y: 0 },
    force: true,
  });

  // Wait for the info panel to show feature info for both layers
  await expect(page.getByTestId('info-panel').getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByTestId('info-panel').getByText('EUCOS Ground Station')).toBeVisible();
});
