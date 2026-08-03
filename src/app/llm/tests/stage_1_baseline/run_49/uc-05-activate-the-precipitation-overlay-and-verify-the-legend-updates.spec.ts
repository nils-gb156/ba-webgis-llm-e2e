// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const legendIndicator = page
    .getByRole('heading', { name: 'Legend', exact: true })
    .or(page.getByRole('button', { name: 'Legend', exact: true }))
    .or(page.getByText('Legend', { exact: true }))
    .first();
  await expect(legendIndicator).toBeVisible();

  const precipitationToggle = page
    .getByRole('checkbox', { name: 'Precipitation', exact: true })
    .or(page.getByRole('switch', { name: 'Precipitation', exact: true }))
    .first();

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const legendContainer = page
    .getByRole('region', { name: 'Legend', exact: true })
    .or(page.getByRole('tabpanel', { name: 'Legend', exact: true }))
    .or(page.getByRole('group', { name: 'Legend', exact: true }))
    .or(page.getByRole('complementary', { name: 'Legend', exact: true }))
    .first();

  if ((await legendContainer.count()) > 0) {
    await expect(legendContainer.getByText('Precipitation', { exact: true })).toBeVisible();
  } else {
    await expect(page.getByText('Precipitation', { exact: true }).nth(1)).toBeVisible();
  }
});
