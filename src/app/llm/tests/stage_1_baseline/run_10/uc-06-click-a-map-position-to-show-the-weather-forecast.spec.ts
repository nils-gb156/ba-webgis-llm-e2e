// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanelByTestId = page.getByTestId('info-panel');
  const infoPanel =
    (await infoPanelByTestId.count()) > 0
      ? infoPanelByTestId.first()
      : page.getByRole('complementary').first();

  await expect(infoPanel).toBeVisible();

  const mapByTestId = page.getByTestId('map');
  const mapByRole = page.getByRole('application', { name: /map/i });
  const map =
    (await mapByTestId.count()) > 0
      ? mapByTestId.first()
      : (await mapByRole.count()) > 0
        ? mapByRole.first()
        : page.locator('canvas').first();

  await expect(map).toBeVisible();

  const mapBounds = await map.boundingBox();
  if (!mapBounds) {
    throw new Error('Map canvas is not interactive.');
  }

  const initialMapImage = await map.screenshot();

  await map.click({
    position: {
      x: Math.max(20, Math.floor(mapBounds.width * 0.6)),
      y: Math.max(20, Math.floor(mapBounds.height * 0.4))
    }
  });

  const forecastHeadingByRole = infoPanel.getByRole('heading', { name: /weather forecast|forecast/i });
  if ((await forecastHeadingByRole.count()) > 0) {
    await expect(forecastHeadingByRole.first()).toBeVisible();
  } else {
    await expect(infoPanel.getByText(/weather forecast|forecast/i).first()).toBeVisible();
  }

  await expect
    .poll(async () => Buffer.compare(await map.screenshot(), initialMapImage))
    .not.toBe(0);

  const forecastRegionByTestId = infoPanel.getByTestId(/weather-forecast/i);
  const forecastRegionByRole = infoPanel.getByRole('region', { name: /weather forecast|forecast/i });
  const forecastContainer =
    (await forecastRegionByTestId.count()) > 0
      ? forecastRegionByTestId.first()
      : (await forecastRegionByRole.count()) > 0
        ? forecastRegionByRole.first()
        : infoPanel;

  const countForecastEntries = async (): Promise<number> => {
    const entryTestIdCount = await forecastContainer.getByTestId(/weather-forecast-entry|forecast-entry/i).count();
    if (entryTestIdCount > 0) {
      return entryTestIdCount;
    }

    const textContent = (await forecastContainer.textContent()) ?? '';
    const timeMatches = textContent.match(/\b\d{1,2}:\d{2}\b/g);
    if (timeMatches && timeMatches.length > 0) {
      return timeMatches.length;
    }

    const listItemCount = await forecastContainer.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await forecastContainer.getByRole('row').count();
    if (rowCount > 0) {
      const headerCount = await forecastContainer.getByRole('columnheader').count();
      return headerCount > 0 ? rowCount - 1 : rowCount;
    }

    return 0;
  };

  await expect.poll(countForecastEntries).toBe(24);
});
