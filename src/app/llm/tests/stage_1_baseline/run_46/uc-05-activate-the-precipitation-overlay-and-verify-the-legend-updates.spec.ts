// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });
  const precipitationText = page.getByText('Precipitation', { exact: true });

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();
  await expect(legendHeading).toBeVisible();

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();
  await expect(legendHeading).toBeVisible();
  await expect(precipitationText.nth(1)).toBeVisible();
});
