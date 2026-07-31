// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index overlay toggle in the layer switcher.
  // Assuming the layer switcher uses test ids for layers or we can find it by text.
  // Based on typical Chakra UI structures in Open Pioneer, layers might have test ids like 'layer-uv-index'
  // or we rely on the accessible name. Let's assume a test id for the toggle or the layer item.
  // If no specific test id is known for the UV-Index layer, we use getByRole with exact name.
  // Common pattern: A checkbox or switch for visibility.
  
  // Attempt to find the UV-Index layer toggle.
  // If the application assigns data-testid to the layer container or toggle, use it.
  // Otherwise, fall back to accessible name.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true })
    .or(page.getByTestId('layer-uv-index-toggle'));
  
  // If the above locator is ambiguous or fails, we might need to scope it to the TOC.
  // Let's try to find the toggle within the layer switcher.
  const toc = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = toc.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Check if the checkbox is already checked. If so, the precondition "initially hidden" might be violated
  // or the state is different. The prompt says it is initially hidden.
  // We expect it to be unchecked initially.
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the UV-Index overlay.
  // Chakra UI checkboxes often require force: true due to decorative overlay elements.
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // Since we cannot assert map canvas content directly via DOM, we rely on the network request
  // or the fact that the layer is now active.
  // However, the expected result states "UV-Index overlay tiles are rendered on the map canvas".
  // Without map helper functions provided in the prompt, we can only assert the UI state (checked)
  // and potentially wait for a network response associated with the WMS/WMTS request for the UV-Index layer.

  // Register a listener for the UV-Index layer request.
  // Assuming the layer uses a WMS or WMTS service.
  // We'll wait for a response that contains 'UV-Index' in the URL or params.
  const uvIndexResponse = page.waitForResponse(response => {
    const url = response.url();
    return url.includes('UV-Index') || url.includes('uv_index') || url.includes('uvindex');
  });

  // Trigger the request by ensuring the map updates or simply waiting if the click triggered it.
  // The click on the checkbox should trigger the map to request the new layer.
  // We already clicked it above. Let's wait for the response.
  await uvIndexResponse;

  // The tiles are now being rendered. We can't assert the canvas content directly without helpers.
  // But the successful response and the checked state are strong indicators.
  // If map helpers were provided, we would poll them here. Since they are not, we conclude here.
});
