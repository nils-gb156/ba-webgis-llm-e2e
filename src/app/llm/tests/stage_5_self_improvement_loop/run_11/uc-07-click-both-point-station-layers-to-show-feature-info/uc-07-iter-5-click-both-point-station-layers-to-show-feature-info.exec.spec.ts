// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it intercepts map clicks)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 600, y: 300 },
    button: 'left',
  });

  // Wait for the info panel to display content for both station types.
  // The info panel contains sections with headings for each layer type.
  // We look for the headings "UV-Index Station" and "EUCOS Ground Station".
  // Using getByRole('heading', { name: ... }) is more robust than getByText.
  const infoPanel = page.getByTestId('info-panel');

  await expect.poll(() => infoPanel.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBeTruthy();
  await expect.poll(() => infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBeTruthy();
});
