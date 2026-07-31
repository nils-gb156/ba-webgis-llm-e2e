// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure base map and overlay layers are visible.
  // The initial state has "EUCOS Ground Stations", "UV-Index Stations", and "Temperature" checked.
  // We ensure the layer switcher is open to verify/adjust layers if needed.
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggle).toBeAttached();
  
  // Ensure layer switcher is open to interact with layers
  const isLayerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherPressed !== 'true') {
    await layerSwitcherToggle.click();
  }

  // Verify at least one operational layer is checked (EUCOS is checked by default)
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(eucosCheckbox).toBeChecked();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByRole('button', { name: 'Print Map' });
  await printToggle.click();

  // Verify the printing panel is visible.
  // The prompt doesn't give a specific testid for the print dialog, but we can infer it's part of the UI flow.
  // Often print dialogs might be a modal or a specific panel. Let's look for the title input which implies the panel is open.
  // We wait for the title input to appear as a sign the print panel is ready.
  const titleInput = page.getByLabel('Title');
  await expect(titleInput).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const title = 'Test Map Printout';
  await titleInput.fill(title);
  await expect(titleInput).toHaveValue(title);

  // Step 3: The user selects the PNG file format.
  const formatRadio = page.getByRole('radio', { name: 'PNG' });
  await expect(formatRadio).toBeVisible();
  
  // Check if PNG is already selected. If not, select it.
  const isPngSelected = await formatRadio.isChecked();
  if (!isPngSelected) {
    await formatRadio.click();
    await expect(formatRadio).toBeChecked();
  }

  // Step 4: The user clicks the export/print button.
  // We need to capture the download event before triggering the action.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Print|Export|Generate/i }).click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  // Clean up the downloaded file
  await download.delete();
});
