// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const precipitationText = page.getByText(/^Precipitation$/);

  let legendContainer = page.getByRole('region', { name: /legend/i });
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('tabpanel', { name: /legend/i });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('complementary', { name: /legend/i });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('group', { name: /legend/i });
  }

  if ((await legendContainer.count()) > 0) {
    await expect(legendContainer).toBeVisible();
    await expect(legendContainer.getByText(/^Precipitation$/)).toHaveCount(0);
  } else {
    const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });
    if ((await legendHeading.count()) > 0) {
      await expect(legendHeading).toBeVisible();
    } else {
      await expect(page.getByText(/^Legend$/)).toBeVisible();
    }
  }

  await expect(precipitationText.first()).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  const initialPrecipitationTextCount =
    (await legendContainer.count()) === 0 ? await precipitationText.count() : 0;

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();

  if ((await legendContainer.count()) > 0) {
    await expect(legendContainer.getByText(/^Precipitation$/)).toBeVisible();
  } else {
    await expect.poll(() => precipitationText.count()).toBeGreaterThan(initialPrecipitationTextCount);
  }
});
