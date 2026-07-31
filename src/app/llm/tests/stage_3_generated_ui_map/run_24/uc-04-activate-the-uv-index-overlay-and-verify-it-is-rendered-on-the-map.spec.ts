// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('coordinate-viewer')).toBeVisible();

  // The UV-Index overlay is initially hidden.
  // We need to find the toggle for the UV-Index layer in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We look for a checkbox or toggle associated with "UV-Index".
  // Since exact names might be ambiguous, we scope to the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Attempt to find the UV-Index layer toggle. 
  // It might be a checkbox or a custom control. 
  // We try getByRole('checkbox') or 'switch' with the name "UV-Index".
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true }).first();
  
  // If checkbox is not found, try switch (some UIs use switches for layer visibility)
  const uvIndexSwitch = layerSwitcher.getByRole('switch', { name: 'UV-Index', exact: true }).first();
  
  // Determine which one exists and click it with force=true due to Chakra UI overlay
  if (uvIndexToggle.isVisible()) {
    await uvIndexToggle.click({ force: true });
  } else if (uvIndexSwitch.isVisible()) {
    await uvIndexSwitch.click({ force: true });
  } else {
    // Fallback: If specific role/name fails, try to find any interactive element near "UV-Index" text
    // This is a last resort. Usually, the layer items have test ids or specific structures.
    // Given the UI map doesn't list specific layer item test ids, we rely on accessible names.
    // If neither checkbox nor switch is found, we might need to look for a button.
    const uvIndexButton = layerSwitcher.getByRole('button', { name: 'UV-Index' }).first();
    if (uvIndexButton.isVisible()) {
       // Check if it's already pressed to avoid toggling off
       const isPressed = await uvIndexButton.getAttribute('aria-pressed');
       if (isPressed !== 'true') {
         await uvIndexButton.click();
       }
    } else {
      throw new Error('Could not find UV-Index layer toggle in layer switcher');
    }
  }

  // Assert the toggle is in the enabled/checked state
  if (uvIndexToggle.isVisible()) {
    await expect(uvIndexToggle).toBeChecked();
  } else if (uvIndexSwitch.isVisible()) {
    await expect(uvIndexSwitch).toBeChecked();
  }

  // Wait for the UV-Index layer to be rendered on the map canvas
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
