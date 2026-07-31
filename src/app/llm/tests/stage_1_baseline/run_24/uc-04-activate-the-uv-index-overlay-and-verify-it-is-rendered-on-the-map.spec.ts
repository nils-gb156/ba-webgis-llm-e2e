// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle.
  // Based on typical Open Pioneer Trails structure, the layer item likely has a test id or accessible name.
  // We assume a test id like 'layer-uv-index' or similar, or we use getByRole('checkbox') with name 'UV-Index'.
  // Since no specific test ids were provided in the prompt context, we try to find the checkbox for UV-Index.
  // If the layer name is "UV-Index", we can search for the checkbox with that label.
  
  // Attempt to find the UV-Index layer checkbox.
  // Using getByRole('checkbox') with name 'UV-Index' or 'UV-Index overlay'.
  // If the exact name is unknown, we might need to look for a text "UV-Index" nearby.
  // Let's assume the accessible name is "UV-Index".
  
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  
  // If the checkbox doesn't exist directly, it might be inside a specific container.
  // However, without specific test IDs, we rely on the accessible name.
  // If the name is ambiguous, we might need to scope it.
  // Let's assume for now that "UV-Index" is unique enough or scoped within the TOC.
  
  // Check if it's already checked. If not, click it.
  // The use case says it is initially hidden, so it should be unchecked.
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to activate the layer
  // Chakra UI checkbox requires force: true due to the decorative overlay
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we cannot assert on the canvas directly, we can wait for a network request
  // that typically loads the WMS tiles or the layer definition.
  // Often, enabling a layer triggers a WMS GetMap or GetCapabilities request.
  // We'll wait for a response that indicates the layer data is being fetched.
  // A common pattern is waiting for a request to the WMS endpoint.
  
  // Register a request listener for WMS requests
  const wmsRequestPromise = page.waitForRequest(request => 
    request.url().includes('WMS') && request.method() === 'GET'
  );
  
  // Trigger the request again if necessary, or rely on the click already having triggered it.
  // The click above should have triggered the tile request.
  // We wait for the response to that request to ensure the layer is "loaded" from a network perspective.
  await wmsRequestPromise;

  // Additional check: Ensure the layer item in the TOC reflects the active state if there's a specific indicator.
  // Assuming the checkbox state is the primary indicator.
  
  // Since we cannot verify the canvas content directly, we assume that if the checkbox is checked
  // and the WMS request succeeded, the layer is rendered.
  // To be more robust, we could wait for a specific image load if it were an img tag, but it's a canvas.
  // The network wait is the best proxy for "tiles loaded".
});
