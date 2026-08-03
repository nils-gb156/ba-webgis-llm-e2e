// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const legend = page.getByTestId('legend');
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(layerSwitcher).toBeVisible();
  await expect(legend).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await precipitationCheckbox.click({ force: true });

  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await expect.poll(async () => {
    const headingCount = await legend.getByRole('heading', { name: /Precipitation/i }).count();
    const imageCount = await legend.getByRole('img', { name: /Precipitation/i }).count();
    const textContent = (await legend.textContent()) ?? '';
    return headingCount > 0 || imageCount > 0 || /Precipitation/i.test(textContent);
  }).toBe(true);

  const precipitationLegendHeading = legend.getByRole('heading', { name: /Precipitation/i });
  const precipitationLegendImage = legend.getByRole('img', { name: /Precipitation/i });

  if (await precipitationLegendHeading.count()) {
    await expect(precipitationLegendHeading.first()).toBeVisible();
  } else if (await precipitationLegendImage.count()) {
    await expect(precipitationLegendImage.first()).toBeVisible();
  } else {
    await expect(legend.getByText(/Precipitation/i)).toBeVisible();
  }
});
