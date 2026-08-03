// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const legendLabel = page.getByText('Legend', { exact: true }).first();

  await expect(precipitationToggle).toBeVisible();
  await expect(legendLabel).toBeVisible();
  await expect(precipitationToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });

  await expect(precipitationToggle).toBeChecked();

  await expect.poll(async () => {
    const precipitationTexts = page.getByText('Precipitation', { exact: true });
    return await precipitationTexts.evaluateAll((elements) => {
      return elements.filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      }).length;
    });
  }).toBeGreaterThan(1);
});
