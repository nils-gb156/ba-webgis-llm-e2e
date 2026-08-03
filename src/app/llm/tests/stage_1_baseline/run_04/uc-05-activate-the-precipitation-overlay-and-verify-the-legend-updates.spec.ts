// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC5 Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const precipitationSwitch = page.getByRole('switch', { name: 'Precipitation', exact: true });
  const precipitationToggle =
    (await precipitationCheckbox.count()) > 0 ? precipitationCheckbox : precipitationSwitch;

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  const legendRegion = page.getByRole('region', { name: 'Legend', exact: true });
  const legendComplementary = page.getByRole('complementary', { name: 'Legend', exact: true });
  const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });

  if ((await legendRegion.count()) > 0) {
    await expect(legendRegion).toBeVisible();
  } else if ((await legendComplementary.count()) > 0) {
    await expect(legendComplementary).toBeVisible();
  } else {
    await expect(legendHeading).toBeVisible();
  }

  const precipitationTexts = page.getByText('Precipitation', { exact: true });
  const visiblePrecipitationTextCount = async () => {
    return await precipitationTexts.evaluateAll((nodes) =>
      nodes.filter((node) => {
        const element = node as HTMLElement;
        const style = window.getComputedStyle(element);
        return (
          !element.hasAttribute('hidden') &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          (element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0)
        );
      }).length
    );
  };

  const initialVisiblePrecipitationTextCount = await visiblePrecipitationTextCount();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  if ((await legendRegion.count()) > 0) {
    await expect(legendRegion.getByText('Precipitation', { exact: true })).toBeVisible();
  } else if ((await legendComplementary.count()) > 0) {
    await expect(legendComplementary.getByText('Precipitation', { exact: true })).toBeVisible();
  } else {
    await expect.poll(async () => {
      return (await visiblePrecipitationTextCount()) > initialVisiblePrecipitationTextCount;
    }).toBe(true);
  }
});
