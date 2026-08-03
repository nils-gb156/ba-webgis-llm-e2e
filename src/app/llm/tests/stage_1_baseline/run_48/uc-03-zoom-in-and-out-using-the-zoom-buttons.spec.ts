// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type ResourceEntry = {
  name: string;
  initiatorType: string;
};

function parseNumericToken(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const direct = Number(value);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const trailingNumber = value.match(/(\d+(?:\.\d+)?)$/);
  if (!trailingNumber) {
    return undefined;
  }

  const parsed = Number(trailingNumber[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractZoomSignal(rawUrl: string): number | undefined {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }

  for (const key of ['z', 'zoom', 'tilematrix', 'tileMatrix', 'TILEMATRIX']) {
    const parsed = parseNumericToken(url.searchParams.get(key));
    if (parsed !== undefined) {
      return parsed;
    }
  }

  const pathMatch = url.pathname.match(/(?:^|\/)(\d+)\/\d+\/\d+(?:\.[a-z0-9]+)?$/i);
  if (pathMatch) {
    return Number(pathMatch[1]);
  }

  const bboxValue = url.searchParams.get('bbox') ?? url.searchParams.get('BBOX');
  if (bboxValue) {
    const parts = bboxValue.split(',').map((part) => Number(part));
    if (parts.length === 4 && parts.every((part) => Number.isFinite(part))) {
      const [minX, minY, maxX, maxY] = parts;
      const width = Math.abs(maxX - minX);
      const height = Math.abs(maxY - minY);
      const span = Math.max(width, height);
      if (span > 0) {
        return -Math.log(span);
      }
    }
  }

  return undefined;
}

function summarizeSignals(signals: number[]): number | undefined {
  if (!signals.length) {
    return undefined;
  }

  const sorted = [...signals].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function getResourceZoomSignals(page: any): Promise<number[]> {
  const entries: ResourceEntry[] = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => ({
      name: entry.name,
      initiatorType: (entry as PerformanceResourceTiming).initiatorType
    }))
  );

  return entries
    .filter((entry) => ['img', 'fetch', 'xmlhttprequest', 'other'].includes(entry.initiatorType))
    .map((entry) => extractZoomSignal(entry.name))
    .filter((value): value is number => value !== undefined);
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await expect.poll(async () => (await getResourceZoomSignals(page)).length).toBeGreaterThan(0);

  const baselineSignals = await getResourceZoomSignals(page);
  const baselineZoomScore = summarizeSignals(baselineSignals);
  if (baselineZoomScore === undefined) {
    throw new Error('Could not determine the initial map zoom level from resource requests.');
  }

  const baselineSignalCount = baselineSignals.length;

  await zoomInButton.click();

  await expect
    .poll(async () => {
      const currentSignals = await getResourceZoomSignals(page);
      return summarizeSignals(currentSignals.slice(baselineSignalCount)) ?? Number.NEGATIVE_INFINITY;
    })
    .toBeGreaterThan(baselineZoomScore);

  await page.waitForLoadState('networkidle');

  const afterZoomInSignals = await getResourceZoomSignals(page);
  const zoomInZoomScore = summarizeSignals(afterZoomInSignals.slice(baselineSignalCount));
  if (zoomInZoomScore === undefined) {
    throw new Error('Could not determine the map zoom level after zooming in.');
  }

  const zoomOutBaselineCount = afterZoomInSignals.length;

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const currentSignals = await getResourceZoomSignals(page);
      return summarizeSignals(currentSignals.slice(zoomOutBaselineCount)) ?? Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(zoomInZoomScore);
});
