// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });

  await expect(precipitationToggle).toBeVisible();

  if (await legendHeading.count()) {
    await expect(legendHeading).toBeVisible();
  } else {
    await expect(page.getByText('Legend', { exact: true })).toBeVisible();
  }

  await expect(precipitationToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();

  const legendRegion = page.getByRole('region', { name: 'Legend', exact: true });
  if (await legendRegion.count()) {
    await expect(legendRegion).toBeVisible();
    await expect(legendRegion.getByText('Precipitation', { exact: true })).toBeVisible();
  } else {
    await expect.poll(async () => {
      return await page.getByText('Precipitation', { exact: true }).evaluateAll((elements) =>
        elements.filter((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        }).length
      );
    }).toBeGreaterThan(1);
  }
});
