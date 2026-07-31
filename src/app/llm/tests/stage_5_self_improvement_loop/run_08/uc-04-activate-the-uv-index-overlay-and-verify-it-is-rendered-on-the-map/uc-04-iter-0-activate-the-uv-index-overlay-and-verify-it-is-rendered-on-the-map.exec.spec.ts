// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The accessibility tree shows a checkbox "UV-Index" that is unchecked.
  // Use force: true because Chakra UI renders the real input visually hidden.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles and verify it is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
