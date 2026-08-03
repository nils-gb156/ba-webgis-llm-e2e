// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type MetricKind = 'zoom' | 'bbox' | 'resolution';

type Metric = {
  kind: MetricKind;
  value: number;
};

function getQueryParamCaseInsensitive(url: URL, name: string): string | undefined {
  for (const [key, value] of url.searchParams.entries()) {
    if (key.toLowerCase() === name.toLowerCase()) {
      return value;
    }
  }
  return undefined;
}

function extractTrailingNumber(value: string): number | undefined {
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractMapMetric(urlString: string): Metric | undefined {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    return undefined;
  }

  const xyzMatch = url.pathname.match(/(?:^|\/)(\d+)\/\d+\/\d+(?:\.\w+)?$/i);
  if (xyzMatch) {
    const zoom = Number(xyzMatch[1]);
    if (Number.isFinite(zoom)) {
      return { kind: 'zoom', value: zoom };
    }
  }

  for (const key of ['tilematrix', 'z', 'zoom', 'level']) {
    const rawValue = getQueryParamCaseInsensitive(url, key);
    if (!rawValue) {
      continue;
    }

    const zoom = extractTrailingNumber(rawValue);
    if (zoom !== undefined) {
      return { kind: 'zoom', value: zoom };
    }
  }

  const bboxValue = getQueryParamCaseInsensitive(url, 'bbox');
  if (bboxValue) {
    const numbers = bboxValue
      .split(',')
      .map((part) => Number(part))
      .filter((part) => Number.isFinite(part));

    if (numbers.length === 4) {
      const width = Math.abs(numbers[2] - numbers[0]);
      const height = Math.abs(numbers[3] - numbers[1]);
      const area = width * height;

      if (area > 0) {
        return { kind: 'bbox', value: 1 / area };
      }
    }
  }

  const resolutionValue = getQueryParamCaseInsensitive(url, 'resolution');
  if (resolutionValue) {
    const resolution = Number(resolutionValue);
    if (Number.isFinite(resolution) && resolution > 0) {
      return { kind: 'resolution', value: 1 / resolution };
    }
  }

  return undefined;
}

function getLatestMetric(metrics: Metric[]): Metric | undefined {
  for (const kind of ['zoom', 'bbox', 'resolution'] as const) {
    for (let index = metrics.length - 1; index >= 0; index -= 1) {
      if (metrics[index].kind === kind) {
        return metrics[index];
      }
    }
  }

  return undefined;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });
  const mapCanvas = page.locator('canvas').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();
  await page.waitForLoadState('networkidle');

  const requestMetrics: Metric[] = [];
  page.on('request', (request) => {
    const metric = extractMapMetric(request.url());
    if (metric) {
      requestMetrics.push(metric);
    }
  });

  const getLatestMetricFromPerformance = async (): Promise<Metric | undefined> => {
    const resourceUrls = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name)
    );

    const metrics = resourceUrls
      .map((resourceUrl) => extractMapMetric(resourceUrl))
      .filter((metric): metric is Metric => metric !== undefined);

    return getLatestMetric(metrics);
  };

  let initialMetric: Metric | undefined;
  await expect.poll(async () => {
    initialMetric = await getLatestMetricFromPerformance();
    return initialMetric ? `${initialMetric.kind}:${initialMetric.value}` : undefined;
  }).toBeDefined();

  await page.evaluate(() => {
    performance.clearResourceTimings();
  });

  const requestCountBeforeZoomIn = requestMetrics.length;
  await zoomInButton.click();
  await page.waitForLoadState('networkidle');

  let zoomInMetric: Metric | undefined;
  await expect.poll(async () => {
    zoomInMetric =
      getLatestMetric(requestMetrics.slice(requestCountBeforeZoomIn)) ??
      (await getLatestMetricFromPerformance());

    if (!initialMetric || !zoomInMetric || zoomInMetric.kind !== initialMetric.kind) {
      return Number.NEGATIVE_INFINITY;
    }

    return zoomInMetric.value - initialMetric.value;
  }).toBeGreaterThan(0);

  await page.evaluate(() => {
    performance.clearResourceTimings();
  });

  const requestCountBeforeZoomOut = requestMetrics.length;
  await zoomOutButton.click();
  await page.waitForLoadState('networkidle');

  let zoomOutMetric: Metric | undefined;
  await expect.poll(async () => {
    zoomOutMetric =
      getLatestMetric(requestMetrics.slice(requestCountBeforeZoomOut)) ??
      (await getLatestMetricFromPerformance());

    if (!zoomInMetric || !zoomOutMetric || zoomOutMetric.kind !== zoomInMetric.kind) {
      return Number.POSITIVE_INFINITY;
    }

    return zoomOutMetric.value - zoomInMetric.value;
  }).toBeLessThan(0);
});
