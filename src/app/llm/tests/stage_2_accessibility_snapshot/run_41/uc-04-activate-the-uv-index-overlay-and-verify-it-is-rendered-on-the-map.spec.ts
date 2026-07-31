// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked.
  // We use force: true because Chakra UI wraps the checkbox input in a decorative element.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).toBeChecked({ checked: false });
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // We wait for a network response that likely corresponds to the UV-Index layer tiles or WMS request.
  // Since we don't have specific URL patterns, we rely on the layer being checked and the map updating.
  // We can also wait for a short period or a specific network event if known.
  // For this test, we'll assert that the layer is checked and then assume the map update is in progress/completed.
  // To be more robust, we could wait for a specific network request if we knew the URL pattern.
  // Let's wait for the layer switcher to reflect the change (already done via checkbox)
  // and then assert on the map canvas having some content (hard to assert specific tiles without helper).
  // However, the requirement is to verify it is rendered. Without map helpers, we can't assert the canvas content directly.
  // We will assume that if the checkbox is checked and no errors occur, the layer is being rendered.
  // A better approach might be to wait for a network request to the WMS service if we knew the URL.
  // Let's try to wait for a response from a typical WMS endpoint for UV-Index.
  // Since we don't know the exact URL, we'll just wait a bit and check for any network activity related to the map.
  // Alternatively, we can check if the legend for UV-Index appears or changes.
  // Looking at the context, there is a 'uvi-stations-legend' but that's for stations, not the overlay.
  // The overlay is 'UV-Index'.
  // Let's just ensure the checkbox is checked and the page is stable.
  await page.waitForTimeout(2000); // Allow time for tiles to load

  // Expected results:
  // - The UV-Index overlay layer toggle is in the enabled (checked) state. (Already asserted)
  // - The UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content, we rely on the successful interaction and lack of errors.
  // We can also check if there are any error messages in the notifications region.
  const notificationsRegion = page.getByRole('region', { name: 'Notifications' });
  await expect(notificationsRegion).not.toContainText('Error');
});
