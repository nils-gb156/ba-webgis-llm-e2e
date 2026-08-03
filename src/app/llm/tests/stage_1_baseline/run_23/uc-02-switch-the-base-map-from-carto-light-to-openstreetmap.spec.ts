// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true }).first();
  const osmRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true }).first();

  let baseMapSelectorNeedsOpening = false;

  try {
    await expect(cartoLightRadio).toBeChecked({ timeout: 3000 });
  } catch {
    baseMapSelectorNeedsOpening = true;
  }

  if (baseMapSelectorNeedsOpening) {
    const toggleCandidates = [
      page.getByRole('tab', { name: /base ?maps?|basemaps?/i }),
      page.getByRole('button', { name: /base ?maps?|basemaps?/i }),
      page.getByRole('link', { name: /base ?maps?|basemaps?/i })
    ];

    for (const candidate of toggleCandidates) {
      const count = await candidate.count();

      for (let i = 0; i < count; i++) {
        const toggle = candidate.nth(i);

        if (!(await toggle.isVisible())) {
          continue;
        }

        const pressed = await toggle.getAttribute('aria-pressed');
        const expanded = await toggle.getAttribute('aria-expanded');
        const selected = await toggle.getAttribute('aria-selected');

        if (pressed !== 'true' && expanded !== 'true' && selected !== 'true') {
          await toggle.click();
        }

        break;
      }
    }
  }

  await expect(cartoLightRadio).toBeChecked();
  await expect(osmRadio).not.toBeChecked();

  await osmRadio.click({ force: true });

  await expect(osmRadio).toBeChecked();
  await expect(cartoLightRadio).not.toBeChecked();
});
