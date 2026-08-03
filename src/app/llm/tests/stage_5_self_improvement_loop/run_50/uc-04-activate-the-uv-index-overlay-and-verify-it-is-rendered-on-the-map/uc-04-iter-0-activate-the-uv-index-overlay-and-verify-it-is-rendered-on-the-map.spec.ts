// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
