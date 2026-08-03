// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  let legendContainer = page.getByRole('region', { name: /legend/i });
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('group', { name: /legend/i });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('tabpanel', { name: /legend/i });
  }
  if ((await legendContainer.count()) === 0) {
    legendContainer = page.getByRole('complementary', { name: /legend/i });
  }

  await expect(legendContainer).toBeVisible();

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();
  await expect(legendContainer.getByText('Precipitation', { exact: true })).toBeVisible();
});
