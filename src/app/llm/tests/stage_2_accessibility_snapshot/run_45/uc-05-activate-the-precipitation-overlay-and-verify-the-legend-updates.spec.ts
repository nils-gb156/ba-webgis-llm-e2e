// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('map-container')).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');

  if (!(await legend.isVisible())) {
    if ((await legendToggle.getAttribute('aria-pressed')) !== 'true') {
      await legendToggle.click();
    }
  }
  await expect(legend).toBeVisible();

  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(precipitationCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  const precipitationLegendHeading = legend.getByRole('heading', { name: /Precipitation/i });
  const precipitationLegendImage = legend.getByRole('img', { name: /Precipitation/i });
  const precipitationLegendText = legend.getByText(/Precipitation/i);

  await expect
    .poll(async () => {
      const headingCount = await precipitationLegendHeading.count();
      const imageCount = await precipitationLegendImage.count();
      const textCount = await precipitationLegendText.count();
      return headingCount + imageCount + textCount;
    })
    .toBeGreaterThan(0);

  if ((await precipitationLegendHeading.count()) > 0) {
    await expect(precipitationLegendHeading.first()).toBeVisible();
  } else if ((await precipitationLegendImage.count()) > 0) {
    await expect(precipitationLegendImage.first()).toBeVisible();
  } else {
    await expect(precipitationLegendText.first()).toBeVisible();
  }
});
