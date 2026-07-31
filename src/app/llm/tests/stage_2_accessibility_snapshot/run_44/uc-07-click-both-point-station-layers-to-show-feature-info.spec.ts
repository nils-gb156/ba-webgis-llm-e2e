// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const infoPanel = page.getByTestId('info-panel');

  // Check if info panel is already pressed/visible
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();

  // Ensure measurement tool is inactive
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click();
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load the station info for both layers
  // We poll the info panel content to wait for the asynchronous feature info to appear
  await expect.poll(async () => {
    const infoPanelContent = await infoPanel.textContent();
    return infoPanelContent;
  }).toContain('UV-Index Station');

  await expect.poll(async () => {
    const infoPanelContent = await infoPanel.textContent();
    return infoPanelContent;
  }).toContain('EUCOS Ground Station');

  // Final assertions to ensure both sections are visible
  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
