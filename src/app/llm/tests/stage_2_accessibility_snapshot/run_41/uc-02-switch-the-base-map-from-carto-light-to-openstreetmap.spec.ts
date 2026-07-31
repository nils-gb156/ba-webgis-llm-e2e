// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open. The accessibility tree indicates it is already pressed/visible,
  // but we ensure it by clicking the toggle if needed or relying on the initial state.
  // Since the prompt says "The layer switcher (TOC) is visible" as a precondition,
  // and the accessibility tree shows "button Layer Switcher [pressed]", it is already open.

  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox "Basemaps" is the selector.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for a list item or option containing "OpenStreetMap".
  // In Chakra UI, comboboxes often render a dropdown list.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We assert that the combobox value (or the selected option) reflects OpenStreetMap.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
