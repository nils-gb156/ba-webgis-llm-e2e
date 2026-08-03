// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const legendHeading = page.getByRole('heading', { name: /legend/i });
  await expect(legendHeading).toBeVisible();

  const precipitationToggle = page
    .getByRole('checkbox', { name: 'Precipitation', exact: true })
    .or(page.getByRole('switch', { name: 'Precipitation', exact: true }));

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const legendPanel = page
    .getByRole('region', { name: /legend/i })
    .or(page.getByRole('complementary', { name: /legend/i }))
    .or(page.getByRole('group', { name: /legend/i }))
    .or(page.getByRole('tabpanel', { name: /legend/i }))
    .first();

  await expect(legendPanel).toBeVisible();
  await expect(legendPanel.getByText('Precipitation', { exact: true })).toBeVisible();
});
