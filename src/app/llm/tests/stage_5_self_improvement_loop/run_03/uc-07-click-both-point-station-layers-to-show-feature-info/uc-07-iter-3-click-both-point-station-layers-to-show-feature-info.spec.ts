// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure info panel is visible
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const infoPanel = page.getByTestId('info-panel');

  // The initial state shows the info panel is visible (pressed), but verify it anyway.
  // If it's not visible, click the toggle to open it.
  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  // Wait for the info panel to be visible after potential opening
  await expect(infoPanel).toBeVisible();

  // Precondition: Ensure UV-Index Stations layer is active
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
  }

  // Precondition: Ensure EUCOS Ground Stations layer is active
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  }

  // Precondition: Ensure measurement tool is not active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click();
  }

  // Step 1: Click at the specified coordinates on the map canvas
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 50, y: 50 },
    button: 'left',
    clickCount: 1,
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // The info panel should display sections for both UV-Index Station and EUCOS Ground Station
  await expect.poll(async () => {
    const panelContent = await infoPanel.textContent();
    return {
      hasUvi: panelContent?.includes('UV-Index Station') ?? false,
      hasEucos: panelContent?.includes('EUCOS Ground Station') ?? false,
    };
  }).toEqual({ hasUvi: true, hasEucos: true });

  // Verify that the info panel contains both station types
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
