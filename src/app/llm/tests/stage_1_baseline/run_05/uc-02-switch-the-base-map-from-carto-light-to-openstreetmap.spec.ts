// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // 1. The user opens the base map selector in the layer switcher.
  // Assuming the base map selector is a button or toggle within the TOC.
  // If there's a specific test id for the base map selector, use it.
  // Otherwise, we look for a role that makes sense, e.g., a button or combobox.
  // Let's assume there's a test id for the base map selector button.
  const baseMapSelectorButton = page.getByTestId('base-map-selector-button');
  await expect(baseMapSelectorButton).toBeVisible();
  await baseMapSelectorButton.click();

  // Wait for the base map list/options to appear
  // Assuming the options are rendered in a list or menu after clicking the selector
  await expect(page.getByTestId('base-map-options-container')).toBeVisible();

  // 2. The user selects 'OpenStreetMap' as the base map.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.

  // Verify OpenStreetMap is now selected
  await expect(openStreetMapOption).toHaveAttribute('aria-selected', 'true');

  // Verify Carto Light is no longer selected
  const cartoLightOption = page.getByRole('option', { name: 'Carto Light' });
  await expect(cartoLightOption).toHaveAttribute('aria-selected', 'false');
});
