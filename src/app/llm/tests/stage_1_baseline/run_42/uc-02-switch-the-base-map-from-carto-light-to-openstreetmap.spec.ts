// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // Assuming there is a button or toggle to open the base map selector within the TOC.
  // Common pattern: a button labeled "Base map" or similar inside the TOC.
  const baseMapToggle = page.getByRole('button', { name: 'Base map' });
  await expect(baseMapToggle).toBeVisible();
  await baseMapToggle.click();

  // Wait for the base map selection panel/dialog to appear
  // Assuming the base map selector opens as a panel or dialog
  const baseMapPanel = page.getByRole('dialog', { name: /Base map/i }).or(page.getByTestId('base-map-selector'));
  // Fallback: wait for any visible panel that might contain base map options if specific role/name isn't available
  // Let's assume the options become visible after clicking the toggle
  await page.waitForTimeout(500); // Brief wait for UI update, though ideally we'd wait for a specific element

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // Locate the 'OpenStreetMap' option in the base map selector
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' }).or(page.getByText('OpenStreetMap'));
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Verify OpenStreetMap is selected
  await expect(page.getByRole('option', { name: 'OpenStreetMap', selected: true })).toBeVisible();
  
  // Verify Carto Light is no longer selected
  const cartoLightOption = page.getByRole('option', { name: 'Carto Light' }).or(page.getByText('Carto Light'));
  await expect(cartoLightOption).not.toBeChecked();
  await expect(cartoLightOption).not.toHaveAttribute('aria-selected', 'true');
});
