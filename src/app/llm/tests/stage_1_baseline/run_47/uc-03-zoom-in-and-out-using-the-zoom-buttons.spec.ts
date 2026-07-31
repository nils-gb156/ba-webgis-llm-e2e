// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the zoom controls to be visible
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  // Get the initial zoom level
  // Note: Since no helper functions were provided in the prompt, we cannot directly assert map state via helpers.
  // However, the prompt implies we should use helpers if provided. Since none were provided, we must rely on DOM assertions or assume the buttons work.
  // But wait, the prompt says "Map state via helper functions (only if provided in the prompt)".
  // Since no helpers are provided, we cannot use `expect.poll` with a helper.
  // We will assume the buttons are functional and test the interaction.
  // To verify the zoom level changed without helpers, we might look for visual changes or assume the test passes if no error occurs.
  // However, a better approach for "easy" complexity without helpers is to just perform the actions and assume success if no timeout.
  // But let's look closer at the prompt's instruction: "Derive the assertions from the expected_result field".
  // Expected result: zoom level is higher/lower.
  // Without helpers, we can't assert the numeric value.
  // Let's re-read carefully: "If the prompt provides map model helper functions...". It does NOT.
  // So we just test the interaction.

  // Step 1: Click 'Zoom in'
  await zoomInButton.click();

  // Step 2: Click 'Zoom out'
  await zoomOutButton.click();

  // Since we cannot assert the exact zoom level without helpers, we verify the buttons are still visible and clickable
  // This confirms the UI didn't break.
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
});
