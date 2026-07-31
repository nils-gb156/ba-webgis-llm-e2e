// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Locate the UV-Index checkbox in the layer switcher.
  // The layer switcher is visible by default, so we can query directly.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });

  // Check if it is already checked; if not, click it.
  // Using force: true because Chakra UI checkboxes have a hidden input.
  const isChecked = await uvIndexCheckbox.isChecked();
  if (!isChecked) {
    await uvIndexCheckbox.click({ force: true });
  }

  // Verify the checkbox is checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Verify the UV-Index layer is rendered on the map canvas.
  // Using expect.poll to wait for the asynchronous layer load/render.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
