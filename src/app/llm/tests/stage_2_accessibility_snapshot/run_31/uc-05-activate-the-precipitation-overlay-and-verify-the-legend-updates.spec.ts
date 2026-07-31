// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is already visible and the Precipitation checkbox is unchecked.
  // Using force: true because Chakra UI checkboxes have a hidden input intercepted by a decorative element.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).toBeChecked({ checked: false });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // The legend panel is already visible. We need to check if a Precipitation legend entry appears.
  // We poll for the presence of text that would likely appear in the precipitation legend.
  // Since we don't have specific text, we'll check for the legend container and assert that
  // the legend has updated content, or specifically look for "Precipitation" in the legend area.
  // However, the prompt says "legend displays an entry corresponding to the Precipitation layer".
  // Let's assume the legend will show some text related to precipitation or the layer name.
  // A safer bet is to look for the legend container and ensure it's visible, then look for
  // any new content. But to be specific, let's try to find "Precipitation" in the legend.
  
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Poll for the legend to contain an entry for Precipitation.
  // We look for the text "Precipitation" within the legend container.
  await expect.poll(() => legend.locator('text=Precipitation').isVisible()).toBeTruthy();
});
