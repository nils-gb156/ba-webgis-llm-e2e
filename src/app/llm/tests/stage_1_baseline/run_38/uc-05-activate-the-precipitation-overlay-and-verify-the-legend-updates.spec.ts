// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const legendTitle = page.getByText('Legend', { exact: true });
  const precipitationTexts = page.getByText('Precipitation', { exact: true });

  await expect(legendTitle).toBeVisible();
  await expect(precipitationToggle).toBeAttached();
  await expect(precipitationToggle).not.toBeChecked();

  await expect.poll(async () => await precipitationTexts.count()).toBe(1);

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();
  await expect(legendTitle).toBeVisible();
  await expect.poll(async () => await precipitationTexts.count()).toBeGreaterThan(1);
  await expect(precipitationTexts.nth(1)).toBeVisible();
});
