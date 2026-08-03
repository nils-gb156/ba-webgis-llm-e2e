// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  let infoPanelCandidates = page.getByRole('complementary');
  if ((await infoPanelCandidates.count()) === 0) {
    infoPanelCandidates = page.locator('aside');
  }
  const infoPanel = infoPanelCandidates.first();
  await expect(infoPanel).toBeVisible();

  const canvasCandidates = page.locator('canvas');
  const canvasCount = await canvasCandidates.count();
  expect(canvasCount).toBeGreaterThan(0);

  let mapCanvas = canvasCandidates.first();
  let largestArea = -1;

  for (let index = 0; index < canvasCount; index++) {
    const candidate = canvasCandidates.nth(index);
    if (!(await candidate.isVisible())) {
      continue;
    }

    const boundingBox = await candidate.boundingBox();
    if (!boundingBox) {
      continue;
    }

    const area = boundingBox.width * boundingBox.height;
    if (area > largestArea) {
      largestArea = area;
      mapCanvas = candidate;
    }
  }

  await expect(mapCanvas).toBeVisible();

  const mapBounds = await mapCanvas.boundingBox();
  if (!mapBounds) {
    throw new Error('Could not determine the map canvas bounds.');
  }

  const clickPosition = {
    x: Math.min(mapBounds.width - 10, Math.max(10, Math.round(mapBounds.width * 0.4))),
    y: Math.min(mapBounds.height - 10, Math.max(10, Math.round(mapBounds.height * 0.4))),
  };

  await mapCanvas.click({ position: clickPosition, trial: true });

  const canvasBeforeClick = await mapCanvas.screenshot();

  await mapCanvas.click({ position: clickPosition });

  await expect.poll(async () => ((await infoPanel.textContent()) ?? '')).toMatch(/weather\s*forecast|forecast/i);

  await expect.poll(async () => {
    const panelText = (await infoPanel.textContent()) ?? '';
    const twentyFourHourMatches = panelText.match(/\b(?:[01]\d|2[0-3]):00\b/g) ?? [];
    const amPmMatches = panelText.match(/\b(?:1[0-2]|0?[1-9])\s?(?:AM|PM)\b/gi) ?? [];
    const listItemCount = await infoPanel.getByRole('listitem').count();
    const rowCount = await infoPanel.getByRole('row').count();
    const dataRowCount = rowCount > 1 ? rowCount - 1 : rowCount;

    const candidateCounts = [
      new Set(twentyFourHourMatches).size,
      new Set(amPmMatches.map((match) => match.toUpperCase())).size,
      listItemCount,
      dataRowCount,
    ];

    return candidateCounts.includes(24);
  }).toBe(true);

  await expect.poll(async () => {
    const canvasAfterClick = await mapCanvas.screenshot();
    return !canvasAfterClick.equals(canvasBeforeClick);
  }).toBe(true);
});
