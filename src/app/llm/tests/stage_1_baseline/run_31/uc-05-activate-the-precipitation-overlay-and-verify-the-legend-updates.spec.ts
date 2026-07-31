// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  const tocPanel = page.getByTestId('layer-switcher');
  await expect(tocPanel).toBeVisible();

  const legendPanel = page.getByTestId('legend');
  await expect(legendPanel).toBeVisible();

  // Locate the Precipitation layer toggle.
  // We assume the layer is identifiable by its accessible name or test id.
  // If no specific test id exists for the layer item, we use getByRole with the layer name.
  // Chakra UI checkboxes/switches need force: true.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true }).first();

  // Ensure the toggle is initially unchecked (hidden) as per preconditions
  await expect(precipitationToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the Precipitation overlay
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Step 2: Verify the legend updates to include the Precipitation layer
  // We expect an entry in the legend corresponding to "Precipitation"
  const legendEntry = page.getByRole('listitem').filter({ hasText: 'Precipitation' }).first();
  
  // Use poll to wait for the legend to update asynchronously
  await expect.poll(async () => {
    const isVisible = await legendEntry.isVisible();
    return isVisible;
  }).toBeTruthy();

  // Optional: Assert that the text "Precipitation" is present in the legend
  await expect(legendEntry).toContainText('Precipitation');
});
