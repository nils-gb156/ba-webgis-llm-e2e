// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });
  await expect(legendHeading).toBeVisible();

  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const precipitationSwitch = page.getByRole('switch', { name: 'Precipitation', exact: true });

  await expect
    .poll(async () => (await precipitationCheckbox.count()) + (await precipitationSwitch.count()))
    .toBeGreaterThan(0);

  const precipitationToggle =
    (await precipitationCheckbox.count()) > 0 ? precipitationCheckbox : precipitationSwitch;

  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  await expect(page.getByText('Precipitation', { exact: true })).toHaveCount(1);

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();
  await expect(page.getByText('Precipitation', { exact: true })).toHaveCount(2);
});
