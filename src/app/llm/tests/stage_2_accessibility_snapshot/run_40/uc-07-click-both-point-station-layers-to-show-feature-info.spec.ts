// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active (it might be toggled on by default)
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is checked
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (await infoPanelToggle.getAttribute('aria-pressed') !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Click on the map at the specified coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to load feature information
  // We poll for the presence of both station sections in the info panel
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUviSection = await infoPanel.getByText('UV-Index Station').isVisible();
    const hasEcosSection = await infoPanel.getByText('EUCOS Ground Station').isVisible();
    return { hasUviSection, hasEcosSection };
  }).toEqual({ hasUviSection: true, hasEcosSection: true });
});
