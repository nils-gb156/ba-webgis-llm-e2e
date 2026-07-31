// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: info panel visible, both station layers active, measurement tool inactive
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure measurement tool is not active (use force: true for Chakra button)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 100, y: 100 },
  });

  // Step 2: Wait for the info panel to load feature info for both layers
  // Use exact names to avoid ambiguity with other occurrences of "Station"
  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true }).count()
  ).toBeGreaterThan(0);

  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).count()
  ).toBeGreaterThan(0);

  // Expected results: verify both sections are displayed in the info panel
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
