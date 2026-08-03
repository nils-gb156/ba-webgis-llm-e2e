// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const openStreetMapRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const cartoLightRadio = layerSwitcher.getByRole('radio', { name: 'Carto Light', exact: true });

  if (!(await openStreetMapRadio.count())) {
    const baseMapSelectorToggle = layerSwitcher.getByRole('button', {
      name: /base maps?|basemaps?|background maps?|base layers?/i
    });

    if (await baseMapSelectorToggle.count()) {
      const toggle = baseMapSelectorToggle.first();
      const expanded = await toggle.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await toggle.click();
      }
    }
  }

  if (await openStreetMapRadio.count()) {
    await openStreetMapRadio.click({ force: true });
    await expect(openStreetMapRadio).toBeChecked();

    if (await cartoLightRadio.count()) {
      await expect(cartoLightRadio).not.toBeChecked();
    }
  } else {
    const openStreetMapButton = layerSwitcher.getByRole('button', { name: 'OpenStreetMap', exact: true });
    const openStreetMapOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true });
    const openStreetMapTreeItem = layerSwitcher.getByRole('treeitem', { name: 'OpenStreetMap', exact: true });
    const openStreetMapLabel = layerSwitcher.getByLabel('OpenStreetMap', { exact: true });

    if (await openStreetMapButton.count()) {
      await openStreetMapButton.first().click();
    } else if (await openStreetMapOption.count()) {
      await openStreetMapOption.first().click();
    } else if (await openStreetMapTreeItem.count()) {
      await openStreetMapTreeItem.first().click();
    } else if (await openStreetMapLabel.count()) {
      await openStreetMapLabel.first().click({ force: true });
    } else {
      await layerSwitcher.getByText('OpenStreetMap', { exact: true }).click();
    }
  }

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
