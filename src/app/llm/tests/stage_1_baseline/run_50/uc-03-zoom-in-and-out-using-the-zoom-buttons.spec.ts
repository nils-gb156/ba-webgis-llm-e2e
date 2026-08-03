// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type CapturedResource = {
  url: string;
  initiatorType?: string;
};

function extractZoomMetric(urlString: string): number | undefined {
  try {
    const url = new URL(urlString);
    const searchParams = url.searchParams;

    const tileMatrix = searchParams.get('TILEMATRIX') ?? searchParams.get('tilematrix');
    if (tileMatrix && /^-?\d+(?:\.\d+)?$/.test(tileMatrix)) {
      return Number(tileMatrix);
    }

    const zParam = searchParams.get('z') ?? searchParams.get('zoom');
    const xParam = searchParams.get('x');
    const yParam = searchParams.get('y');
    if (zParam && /^-?\d+(?:\.\d+)?$/.test(zParam) && xParam && yParam) {
      return Number(zParam);
    }

    const bbox = searchParams.get('BBOX') ?? searchParams.get('bbox');
    if (bbox) {
      const values = bbox.split(',').map(Number);
      if (values.length === 4 && values.every((value) => Number.isFinite(value))) {
        const area = Math.abs((values[2] - values[0]) * (values[3] - values[1]));
        if (area > 0) {
          return 1 / area;
        }
      }
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const thirdLast = segments.at(-3) ?? '';
    const secondLast = segments.at(-2) ?? '';
    const last = segments.at(-1) ?? '';
    const tileMatch = last.match(/^(\d+)(?:\.(png|jpg|jpeg|webp|pbf|mvt))$/i);

    if (/^\d+$/.test(thirdLast) && /^\d+$/.test(secondLast) && tileMatch) {
      return Number(thirdLast);
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function collectMetrics(resources: CapturedResource[]): number[] {
  const allowedInitiatorTypes = new Set([
    'img',
    'image',
    'xmlhttprequest',
    'xhr',
    'fetch',
    'other'
  ]);

  return resources
    .filter((resource) => !resource.initiatorType || allowedInitiatorTypes.has(resource.initiatorType))
    .map((resource) => extractZoomMetric(resource.url))
    .filter((metric): metric is number => metric !== undefined && Number.isFinite(metric));
}

function representativeMetric(metrics: number[]): number | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const counts = new Map<string, { value: number; count: number; lastIndex: number }>();

  for (const [index, value] of metrics.entries()) {
    const key = Number.isInteger(value) ? String(value) : value.toPrecision(12);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
      existing.lastIndex = index;
    } else {
      counts.set(key, { value, count: 1, lastIndex: index });
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || b.lastIndex - a.lastIndex)[0]?.value;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await page.waitForLoadState('networkidle');

  const initialResources: CapturedResource[] = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map((entry) => {
      const resourceEntry = entry as PerformanceResourceTiming;
      return {
        url: resourceEntry.name,
        initiatorType: resourceEntry.initiatorType
      };
    });
  });

  const initialMetric = representativeMetric(collectMetrics(initialResources));
  if (initialMetric === undefined) {
    throw new Error('Could not derive the initial map zoom metric from resource requests.');
  }

  const zoomInResources: CapturedResource[] = [];
  const zoomOutResources: CapturedResource[] = [];
  let captureStage: 'zoomIn' | 'zoomOut' | undefined;

  const requestListener = (request: { url(): string; resourceType(): string }) => {
    const resource = {
      url: request.url(),
      initiatorType: request.resourceType()
    };

    if (captureStage === 'zoomIn') {
      zoomInResources.push(resource);
    } else if (captureStage === 'zoomOut') {
      zoomOutResources.push(resource);
    }
  };

  page.on('request', requestListener);

  captureStage = 'zoomIn';
  await zoomInButton.click();

  await expect
    .poll(() => representativeMetric(collectMetrics(zoomInResources)) ?? Number.NEGATIVE_INFINITY)
    .toBeGreaterThan(initialMetric);

  const zoomInMetric = representativeMetric(collectMetrics(zoomInResources));
  if (zoomInMetric === undefined) {
    throw new Error('Could not derive the zoomed-in map zoom metric from resource requests.');
  }

  captureStage = 'zoomOut';
  await zoomOutButton.click();

  await expect
    .poll(() => representativeMetric(collectMetrics(zoomOutResources)) ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(zoomInMetric);

  captureStage = undefined;
  page.off('request', requestListener);
});
