// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is visible by default.
  // We need to find the UV-Index layer toggle.
  // Based on the UI map, we have a layer-switcher panel.
  // The specific toggle for UV-Index is not explicitly listed with a test-id in the provided UI map snippet,
  // but we can infer its location within the layer switcher.
  // However, looking at the UI map, we see `layer-switcher` is a panel.
  // We need to interact with the specific layer item.
  // Since no specific test-id is given for the UV-Index layer toggle in the UI Map,
  // we will use the accessible name "UV-Index" within the layer switcher.

  const layerSwitcher = page.getByRole('region', { name: /Layer Switcher/i }).or(page.getByTestId('layer-switcher'));
  
  // Wait for layer switcher to be visible
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index layer toggle within the layer switcher.
  // It is likely a checkbox or button.
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true }).or(
    layerSwitcher.getByRole('button', { name: 'UV-Index', exact: true })
  );

  // If the checkbox doesn't exist, try finding a button or other interactive element with the text "UV-Index"
  // Often in Chakra UI, these are rendered as custom checkboxes.
  // Let's try to find the element by text if role fails, but scoped.
  const uvIndexLayerItem = layerSwitcher.getByText('UV-Index', { exact: true }).first();

  // Determine if the toggle is already checked.
  // If it's a checkbox, we can check its state.
  // If it's a button, we might check aria-pressed.
  
  // Let's assume it's a checkbox-like control.
  // We will try to click the toggle. If it's already checked, clicking it will uncheck it.
  // We want it checked. So we should check its current state.
  
  // Since we don't have a direct test-id, we'll use the text label to find the container and then find the input/button.
  // A robust way with Chakra is to find the label and then the associated control.
  
  // Let's try to click the "UV-Index" text if it acts as a toggle, or find the checkbox near it.
  // Given the UI map mentions `layer-switcher` is visible, and layers are listed.
  
  // We will use `getByText` scoped to the layer switcher to find the UV-Index item, then find the checkbox.
  const uvIndexItemContainer = layerSwitcher.getByText('UV-Index', { exact: true }).first().locator('..');
  
  // Try to find a checkbox within this container
  const uvIndexCheckbox = uvIndexItemContainer.getByRole('checkbox', { name: 'UV-Index', exact: true }).first();
  
  // If no checkbox, try button
  const uvIndexButton = uvIndexItemContainer.getByRole('button', { name: 'UV-Index', exact: true }).first();
  
  // If neither, try the item itself if it's clickable
  const uvIndexClickable = uvIndexItemContainer;

  // Check current state of the checkbox if it exists
  let isChecked = false;
  if (uvIndexCheckbox.count() > 0) {
    isChecked = await uvIndexCheckbox.isChecked();
  } else if (uvIndexButton.count() > 0) {
    isChecked = await uvIndexButton.getAttribute('aria-pressed') === 'true';
  }

  // If not checked, click to enable
  if (!isChecked) {
    // Chakra UI checkboxes often have the input hidden, so we force click
    if (uvIndexCheckbox.count() > 0) {
      await uvIndexCheckbox.click({ force: true });
    } else if (uvIndexButton.count() > 0) {
      await uvIndexButton.click();
    } else {
      await uvIndexClickable.click();
    }
  }

  // Wait for the layer to be rendered on the map
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Verify the toggle is in the enabled (checked) state
  if (uvIndexCheckbox.count() > 0) {
    await expect(uvIndexCheckbox).toBeChecked();
  } else if (uvIndexButton.count() > 0) {
    await expect(uvIndexButton).toHaveAttribute('aria-pressed', 'true');
  }
});
