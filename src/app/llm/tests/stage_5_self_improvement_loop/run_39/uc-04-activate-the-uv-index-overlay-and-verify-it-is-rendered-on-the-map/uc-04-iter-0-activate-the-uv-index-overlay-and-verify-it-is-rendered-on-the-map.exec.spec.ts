// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }

  await expect(layerSwitcher).toBeVisible();

  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(uvIndexCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
