// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('toc')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // Assuming the Precipitation layer has a test id or accessible name.
  // If it has a test id like 'precipitation-layer-toggle', use that.
  // Otherwise, use getByRole('checkbox', { name: 'Precipitation' }) or similar.
  // Since specific test ids aren't provided in the prompt, we assume standard naming or accessible names.
  // Let's assume the toggle is a checkbox with the name 'Precipitation'.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  
  // Ensure the toggle is visible before clicking
  await expect(precipitationToggle).toBeVisible();
  
  // Click the toggle to enable the layer
  await precipitationToggle.click();

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 2 (continued): Verify the legend displays an entry corresponding to the Precipitation layer
  // Assuming the legend has an entry with the text 'Precipitation' or a specific test id.
  // Let's assume the legend entry has the text 'Precipitation'.
  const legendEntry = page.getByTestId('legend').getByText('Precipitation');
  
  // Wait for the legend entry to be visible, as the legend updates asynchronously
  await expect(legendEntry).toBeVisible();
});
