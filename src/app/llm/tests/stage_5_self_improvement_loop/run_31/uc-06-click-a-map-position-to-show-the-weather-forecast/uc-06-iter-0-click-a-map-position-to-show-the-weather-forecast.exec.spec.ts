// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const mapContainer = page.getByTestId('map-container');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toBeVisible();
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(mapContainer).toBeVisible();

  await expect.poll(async () => (await getMapCenter(page))?.length ?? 0).toBe(2);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.6),
      y: Math.round(mapBox!.height * 0.45)
    }
  });

  await expect.poll(async () => (await getHighlightedCoordinate(page))?.length ?? 0).toBe(2);

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const allElements = [section, ...Array.from(section.querySelectorAll('*'))];

      let bestRepeatedSiblingGroup = 0;
      for (const element of allElements) {
        const children = Array.from(element.children).filter((child) => {
          return !(child instanceof HTMLElement) || child.offsetParent !== null;
        });

        if (children.length < 20) {
          continue;
        }

        const groups = new Map<string, number>();
        for (const child of children) {
          const signature = `${child.tagName}|${child.getAttribute('role') ?? ''}|${child.childElementCount}`;
          groups.set(signature, (groups.get(signature) ?? 0) + 1);
        }

        for (const count of groups.values()) {
          bestRepeatedSiblingGroup = Math.max(bestRepeatedSiblingGroup, count);
        }
      }

      const uniqueTimes = new Set<string>();
      for (const element of allElements) {
        if (element.children.length > 0) {
          continue;
        }
        const text = element.textContent ?? '';
        const matches = text.match(/\b(?:[01]\d|2[0-3]):\d{2}\b/g) ?? [];
        for (const match of matches) {
          uniqueTimes.add(match);
        }
      }

      if (bestRepeatedSiblingGroup === 24 || uniqueTimes.size === 24) {
        return 24;
      }

      return Math.max(bestRepeatedSiblingGroup, uniqueTimes.size);
    });
  }).toBe(24);
});
