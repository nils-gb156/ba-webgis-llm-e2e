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
  if ((await precipitationToggle.count()) === 0) {
    precipitationToggle = page.getByLabel('Precipitation', { exact: true });
  }
  precipitationToggle = precipitationToggle.first();

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  let legendContainer = page.getByRole('region', { name: 'Legend', exact: true });
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('complementary', { name: 'Legend', exact: true });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('tabpanel', { name: 'Legend', exact: true });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('group', { name: 'Legend', exact: true });
  }

  if ((await legendContainer.count()) > 0) {
    legendContainer = legendContainer.first();
    await expect(legendContainer).toBeVisible();
    await expect(legendContainer.getByText('Precipitation', { exact: true })).toHaveCount(0);
  } else {
    await expect(page.getByRole('heading', { name: 'Legend', exact: true })).toBeVisible();
    await expect(page.getByText('Precipitation', { exact: true })).toHaveCount(1);
  }

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  if ((await legendContainer.count()) > 0) {
    await expect(legendContainer.getByText('Precipitation', { exact: true })).toBeVisible();
  } else {
    await expect(page.getByText('Precipitation', { exact: true })).toHaveCount(2);
  }
});
