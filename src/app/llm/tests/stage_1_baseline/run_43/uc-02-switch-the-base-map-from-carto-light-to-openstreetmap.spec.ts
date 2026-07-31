// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Open the base map selector in the layer switcher
  // Assuming the base map selector is a button or toggle within the layer switcher
  // We look for a button that likely says "Base map" or has a relevant test id
  const baseMapSelector = page.getByTestId('base-map-selector');
  if (baseMapSelector.isVisible()) {
    await baseMapSelector.click();
  } else {
    // Fallback if test id is not available, try finding by role/text within the TOC
    const toc = page.getByTestId('layer-switcher');
    const baseMapButton = toc.getByRole('button', { name: /base map/i });
    await baseMapButton.click();
  }

  // Wait for the base map options panel/dialog to be visible
  // Assuming the options appear in a list or dialog within the TOC
  const baseMapOptionsContainer = page.getByTestId('base-map-options');
  if (baseMapOptionsContainer.isVisible()) {
    await expect(baseMapOptionsContainer).toBeVisible();
  } else {
    // Fallback: look for a list of base maps within the TOC
    const toc = page.getByTestId('layer-switcher');
    await expect(toc.locator('ul')).toBeVisible();
  }

  // Step 2: Select 'OpenStreetMap' as the base map
  // We look for a radio button or list item labeled 'OpenStreetMap'
  const osmOption = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  if (osmOption.isVisible()) {
    await osmOption.click({ force: true });
  } else {
    // Fallback: look for a list item or button with the text 'OpenStreetMap'
    const toc = page.getByTestId('layer-switcher');
    const osmButton = toc.getByRole('button', { name: 'OpenStreetMap', exact: true });
    if (osmButton.isVisible()) {
      await osmButton.click();
    } else {
      // Last resort: look for any element with the text
      await page.getByText('OpenStreetMap', { exact: true }).click();
    }
  }

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.

  // Verify OpenStreetMap is selected
  const osmSelected = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  await expect(osmSelected).toBeChecked();

  // Verify Carto Light is no longer selected
  const cartoLightOption = page.getByRole('radio', { name: 'Carto Light', exact: true });
  await expect(cartoLightOption).not.toBeChecked();
});
