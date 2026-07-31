// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it appears to be open by default based on context)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure no measurement tool is active.
  // The accessibility tree shows "Measurement" button is not pressed.
  // We explicitly click it if it were pressed, but here we just ensure it's off.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click();
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

  // Click on the map at the specified coordinates
  // The map container is the canvas or the div holding it.
  // We use the test id for the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to load feature info for both layers.
  // We poll the info panel content to see if it contains the expected sections.
  await expect.poll(async () => {
    const infoPanelContent = await infoPanel.textContent();
    return infoPanelContent;
  }).toContain('UV-Index Station');

  await expect.poll(async () => {
    const infoPanelContent = await infoPanel.textContent();
    return infoPanelContent;
  }).toContain('EUCOS Ground Station');
});
