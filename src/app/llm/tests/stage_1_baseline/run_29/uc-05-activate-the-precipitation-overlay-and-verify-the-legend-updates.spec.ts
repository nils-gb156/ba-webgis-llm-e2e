// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  let precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  if ((await precipitationToggle.count()) === 0) {
    precipitationToggle = page.getByRole('switch', { name: 'Precipitation', exact: true });
  }

  await expect(precipitationToggle).toBeVisible();

  let legendContainer = page.getByTestId('legend');
  let canScopeLegend = true;

  if ((await legendContainer.count()) > 0) {
    await expect(legendContainer).toBeVisible();
  } else {
    legendContainer = page.getByRole('region', { name: 'Legend', exact: true });
    if ((await legendContainer.count()) > 0) {
      await expect(legendContainer).toBeVisible();
    } else {
      legendContainer = page.getByRole('complementary', { name: 'Legend', exact: true });
      if ((await legendContainer.count()) > 0) {
        await expect(legendContainer).toBeVisible();
      } else {
        canScopeLegend = false;
        const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });
        if ((await legendHeading.count()) > 0) {
          await expect(legendHeading).toBeVisible();
        } else {
          await expect(page.getByText('Legend', { exact: true })).toBeVisible();
        }
      }
    }
  }

  await expect(precipitationToggle).not.toBeChecked();

  const precipitationTextCountBefore = await page.getByText('Precipitation', { exact: true }).count();

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();

  if (canScopeLegend) {
    await expect(legendContainer).toContainText('Precipitation');
  } else {
    await expect
      .poll(async () => await page.getByText('Precipitation', { exact: true }).count())
      .toBeGreaterThan(precipitationTextCountBefore);
  }
});
