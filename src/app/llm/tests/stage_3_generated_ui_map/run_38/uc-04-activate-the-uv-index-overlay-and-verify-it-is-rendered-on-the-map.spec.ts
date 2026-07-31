// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();

  // The UV-Index layer is initially hidden. Click its toggle in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We need to find the UV-Index layer toggle. Since specific test ids for layer toggles
  // are not listed in the provided UI map (only general layer-switcher panel), we assume
  // standard Chakra UI checkbox/switch behavior within the layer switcher.
  // However, looking at the UI map, there is no specific test id for individual layer toggles.
  // We will use getByRole to find the UV-Index layer control.
  // The layer switcher panel is likely a dialog or a specific panel.
  // Let's look for a checkbox or switch labeled "UV-Index" inside the layer switcher.
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Find the UV-Index layer toggle. It's likely a checkbox or switch.
  // We use exact name to avoid ambiguity if other layers have similar names.
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true }).or(
    layerSwitcher.getByRole('switch', { name: 'UV-Index', exact: true })
  );

  // If the toggle doesn't exist as checkbox/switch, it might be a button with aria-pressed.
  // But Chakra UI usually uses checkbox/switch for visibility.
  // If it's not found, we might need to look for a button.
  // Let's try clicking the checkbox/switch. If it's already checked, this might fail or do nothing.
  // The use case says it's initially hidden, so it should be unchecked.
  
  // Fallback: if getByRole fails, we might need to look for text "UV-Index" and click its parent control.
  // But let's assume standard ARIA roles first.
  
  // If the element is a Chakra checkbox, it renders a visually hidden input with role="checkbox"
  // and a decorative div. Clicking the role locator with force:true is recommended.
  
  if (await uvIndexToggle.count() > 0) {
    await uvIndexToggle.click({ force: true });
  } else {
    // Fallback: Try to find a button or link with "UV-Index" inside the layer switcher
    // This is less robust but handles cases where the toggle is not a standard checkbox/switch
    const uvIndexControl = layerSwitcher.getByRole('button', { name: 'UV-Index' }).or(
      layerSwitcher.getByRole('link', { name: 'UV-Index' })
    );
    if (await uvIndexControl.count() > 0) {
      await uvIndexControl.click();
    } else {
      // Last resort: Click on the text "UV-Index" inside the layer switcher
      // This is risky if "UV-Index" appears elsewhere, but layer switcher is scoped.
      const uvIndexText = layerSwitcher.getByText('UV-Index', { exact: true });
      if (await uvIndexText.count() > 0) {
        // Try to click the parent element which might be the control
        await uvIndexText.click();
      }
    }
  }

  // Wait for the layer to be rendered on the map
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Verify the toggle is in the enabled (checked) state
  // Re-find the toggle to assert its state
  const updatedUvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true }).or(
    layerSwitcher.getByRole('switch', { name: 'UV-Index', exact: true })
  );
  
  if (await updatedUvIndexToggle.count() > 0) {
    await expect(updatedUvIndexToggle).toBeChecked();
  } else {
    // If it's a button, check if it has aria-pressed="true"
    const uvIndexButton = layerSwitcher.getByRole('button', { name: 'UV-Index' });
    if (await uvIndexButton.count() > 0) {
      await expect(uvIndexButton).toHaveAttribute('aria-pressed', 'true');
    }
  }
});
