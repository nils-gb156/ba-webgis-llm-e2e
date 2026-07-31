// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the Precipitation overlay
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(precipitationCheckbox).toBeChecked();

  // Verify the layer is rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: View the legend and verify it displays the Precipitation entry
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
