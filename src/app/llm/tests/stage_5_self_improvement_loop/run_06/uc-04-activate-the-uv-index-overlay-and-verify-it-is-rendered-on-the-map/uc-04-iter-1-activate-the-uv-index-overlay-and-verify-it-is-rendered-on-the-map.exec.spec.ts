// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible (precondition)
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The accessibility tree shows two checkboxes whose accessible names contain "UV-Index":
  //   - "UV-Index Stations" (checked)
  //   - "UV-Index" (unchecked)
  // The use case targets the "UV-Index" overlay. Use { exact: true } to disambiguate.
  // Chakra UI checkboxes require force: true on the role locator.
  const uvIndexCheckbox = page
    .getByRole('list', { name: 'Operational layers' })
    .getByRole('checkbox', { name: 'UV-Index', exact: true });
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // Step 3: Verify the UV-Index overlay layer toggle is enabled and the layer is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
