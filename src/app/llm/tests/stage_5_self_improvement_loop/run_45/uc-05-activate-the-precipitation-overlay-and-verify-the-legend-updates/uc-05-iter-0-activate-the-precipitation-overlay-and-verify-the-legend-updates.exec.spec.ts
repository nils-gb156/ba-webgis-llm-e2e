// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legendPanel = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  if (!(await layerSwitcherPanel.isVisible())) {
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcherPanel).toBeVisible();

  if (!(await legendPanel.isVisible())) {
    await expect(legendToggle).toHaveAttribute('aria-pressed', 'false');
    await legendToggle.click();
  }
  await expect(legendPanel).toBeVisible();

  const precipitationCheckbox = layerSwitcherPanel.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await precipitationCheckbox.click({ force: true });

  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
  await expect(legendPanel).toContainText(/Precipitation/i);
});
