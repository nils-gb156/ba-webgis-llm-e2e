// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Layer switcher (TOC) is visible.
  // We assume the TOC is open by default or becomes visible.
  // Based on typical Chakra UI patterns, the TOC might be a panel.
  // Let's look for a button to open it if it's closed, or just proceed if visible.
  // The prompt says "The layer switcher (TOC) is visible." so we assume it's already there.
  
  // Step 1: The user opens the base map selector in the layer switcher.
  // We need to identify the base map selector. Usually, there's a button or a section in the TOC.
  // Let's look for a button labeled "Base Map" or similar within the TOC.
  // If the TOC is a dialog or panel, we might need to scope our search.
  
  // Assuming the TOC is visible and has a button/section for base maps.
  // Let's try to find the base map selector button.
  // Common pattern: A button with text "Base Map" or an icon.
  
  // Let's assume there is a button to toggle the base map list.
  // If the TOC is open, we might see the list directly or a button to expand it.
  // Let's look for a button that says "Base Map" or similar.
  
  // Since specific test IDs are not provided, we rely on accessible names.
  // Let's assume the TOC has a button labeled "Base Map" to open the selector.
  
  // First, ensure the TOC is visible. If there's a toggle for the TOC, we might need to click it.
  // But the precondition says it is visible.
  
  // Let's look for the base map selector. It might be a button inside the TOC.
  // Let's try to find a button with the text "Base Map".
  const baseMapButton = page.getByRole('button', { name: 'Base Map' });
  
  // If the button exists, click it to open the selector.
  // It's possible the selector is always open or opened by clicking the TOC header.
  // Let's assume clicking "Base Map" opens the list of base maps.
  if (await baseMapButton.isVisible()) {
    await baseMapButton.click();
  }

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We need to find the option for 'OpenStreetMap'.
  // It might be a radio button, a list item, or a button.
  // Let's look for a radio button or option labeled 'OpenStreetMap'.
  
  // We should scope the search to the base map selector area.
  // If the base map button opened a dropdown or panel, we should look there.
  // Let's assume the base map options are now visible.
  
  // Let's look for a radio button or a button with the text 'OpenStreetMap'.
  const osmOption = page.getByRole('radio', { name: 'OpenStreetMap' });
  
  // If radio buttons are not used, it might be a button or list item.
  // Let's try to find it by text if radio button is not found, but prefer role.
  // Let's try to find a button or list item with the text 'OpenStreetMap'.
  
  // Let's assume it's a radio button for single selection.
  if (await osmOption.isVisible()) {
    await osmOption.click();
  } else {
    // Fallback: maybe it's a button or a list item.
    const osmButton = page.getByRole('button', { name: 'OpenStreetMap' });
    if (await osmButton.isVisible()) {
      await osmButton.click();
    } else {
      // Last resort: look for any element with the text 'OpenStreetMap'
      const osmText = page.getByText('OpenStreetMap');
      if (await osmText.isVisible()) {
        await osmText.click();
      }
    }
  }

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // We can verify by checking the radio button state or the active state of the options.
  await expect(osmOption).toBeChecked();
  
  // Check that Carto Light is not selected.
  const cartoLightOption = page.getByRole('radio', { name: 'Carto Light' });
  if (await cartoLightOption.isVisible()) {
    await expect(cartoLightOption).not.toBeChecked();
  }
});
