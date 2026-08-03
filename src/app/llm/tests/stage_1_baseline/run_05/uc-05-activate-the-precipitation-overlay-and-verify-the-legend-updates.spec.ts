// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const precipitationToggle = page.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });
  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  const legendHeading = page.getByRole('heading', { name: 'Legend', exact: true });
  await expect(legendHeading).toBeVisible();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  let legendEntry = page.getByText('Precipitation', { exact: true }).nth(1);

  const legendRegion = page.getByRole('region', { name: 'Legend', exact: true });
  if ((await legendRegion.count()) > 0) {
    legendEntry = legendRegion.getByText('Precipitation', { exact: true });
  } else {
    const legendComplementary = page.getByRole('complementary', {
      name: 'Legend',
      exact: true
    });
    if ((await legendComplementary.count()) > 0) {
      legendEntry = legendComplementary.getByText('Precipitation', { exact: true });
    } else {
      const legendTabpanel = page.getByRole('tabpanel', { name: 'Legend', exact: true });
      if ((await legendTabpanel.count()) > 0) {
        legendEntry = legendTabpanel.getByText('Precipitation', { exact: true });
      } else {
        const legendGroup = page.getByRole('group', { name: 'Legend', exact: true });
        if ((await legendGroup.count()) > 0) {
          legendEntry = legendGroup.getByText('Precipitation', { exact: true });
        }
      }
    }
  }

  await expect(legendEntry).toBeVisible();
});
