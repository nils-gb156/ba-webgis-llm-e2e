// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and toggled on
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const infoPanel = page.getByTestId('info-panel');
  
  // Check if the info panel is already pressed/visible. If not, click to open it.
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click();
  }
  
  // Ensure the info panel is visible
  await expect(infoPanel).toBeVisible();

  // Ensure no measurement tool is active. The accessibility tree shows "Measurement" button.
  // We should ensure it's not in an active state if it were, though preconditions say it's not.
  // Just in case, we can try to close it if it were open, but the prompt says it's not active.
  // We'll proceed with the click on the map.

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load the station info for both layers.
  // We expect to see sections for 'UV-Index Station' and 'EUCOS Ground Station'.
  // Since the content is dynamic, we poll for the presence of these sections within the info panel.
  
  // Check for UV-Index Station section
  await expect.poll(() => 
    infoPanel.getByRole('heading', { name: 'UV-Index Station', level: 2 }).isVisible()
  ).toBeTruthy();

  // Check for EUCOS Ground Station section
  await expect.poll(() => 
    infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 }).isVisible()
  ).toBeTruthy();
});
