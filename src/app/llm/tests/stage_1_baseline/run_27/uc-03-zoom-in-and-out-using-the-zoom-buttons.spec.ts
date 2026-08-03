// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const zoomInByRole = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutByRole = page.getByRole('button', { name: 'Zoom out', exact: true });

  const zoomInButton =
    (await zoomInByRole.count()) > 0 ? zoomInByRole : page.getByTitle('Zoom in', { exact: true });
  const zoomOutButton =
    (await zoomOutByRole.count()) > 0 ? zoomOutByRole : page.getByTitle('Zoom out', { exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(zoomInButton).toBeEnabled();
  await expect(zoomOutButton).toBeEnabled();

  type MapMetric = { kind: 'zoom' | 'bboxArea'; value: number };
  type MetricSnapshot = { metric: MapMetric; index: number };

  const parseTrailingNumber = (value: string | null | undefined): number | undefined => {
    if (!value) {
      return undefined;
    }
    const match = value.match(/-?\d+(?:\.\d+)?$/);
    if (!match) {
      return undefined;
    }
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const parseZoomFromUrl = (urlString: string): number | undefined => {
    try {
      const url = new URL(urlString);
      const searchCandidates = ['zoom', 'z', 'level'];
      for (const key of searchCandidates) {
        const parsed = parseTrailingNumber(url.searchParams.get(key));
        if (parsed !== undefined) {
          return parsed;
        }
      }

      const hash = url.hash;
      if (!hash) {
        return undefined;
      }

      const keyedMatch = hash.match(/(?:^|[?#/&,_-])(zoom|z|level)=(-?\d+(?:\.\d+)?)/i);
      if (keyedMatch) {
        return Number(keyedMatch[2]);
      }

      const mapMatch = hash.match(/map=(-?\d+(?:\.\d+)?)\/-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?/i);
      if (mapMatch) {
        return Number(mapMatch[1]);
      }

      const slashMatch = hash.match(/^#(-?\d+(?:\.\d+)?)\/-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/);
      if (slashMatch) {
        return Number(slashMatch[1]);
      }

      return undefined;
    } catch {
      return undefined;
    }
  };

  const parseResourceMetric = (resourceUrl: string): MapMetric | undefined => {
    try {
      const url = new URL(resourceUrl);
      const params = new Map<string, string>();
      url.searchParams.forEach((value, key) => params.set(key.toLowerCase(), value));

      const pathname = url.pathname.toLowerCase();
      const isLikelyTileFile = /\.(png|jpg|jpeg|webp|gif|pbf|mvt)$/.test(pathname);
      const hasMapParams = ['service', 'request', 'bbox', 'tilematrix', 'layers', 'zoom', 'z', 'level'].some((key) =>
        params.has(key)
      );

      if (isLikelyTileFile) {
        const xyzMatch = pathname.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.(png|jpg|jpeg|webp|gif|pbf|mvt))$/);
        if (xyzMatch) {
          return { kind: 'zoom', value: Number(xyzMatch[1]) };
        }
      }

      if (!hasMapParams) {
        return undefined;
      }

      for (const key of ['zoom', 'z', 'level', 'tilematrix']) {
        const parsed = parseTrailingNumber(params.get(key));
        if (parsed !== undefined) {
          return { kind: 'zoom', value: parsed };
        }
      }

      const service = params.get('service')?.toUpperCase();
      const request = params.get('request')?.toUpperCase();
      if ((service === 'WMS' || request === 'GETMAP' || request === 'GETTILE') && params.has('bbox')) {
        const bbox = params
          .get('bbox')
          ?.split(',')
          .map((value) => Number(value.trim()));

        if (bbox && bbox.length === 4 && bbox.every((value) => Number.isFinite(value))) {
          const [minX, minY, maxX, maxY] = bbox;
          return { kind: 'bboxArea', value: Math.abs((maxX - minX) * (maxY - minY)) };
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  };

  const getResourceUrls = async (): Promise<string[]> => {
    return await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name)
    );
  };

  const findLatestMetric = (urls: string[]): MetricSnapshot | undefined => {
    for (let index = urls.length - 1; index >= 0; index -= 1) {
      const metric = parseResourceMetric(urls[index]);
      if (metric) {
        return { metric, index };
      }
    }
    return undefined;
  };

  const areSameMetric = (left: MapMetric, right: MapMetric): boolean => {
    if (left.kind !== right.kind) {
      return false;
    }
    if (left.kind === 'zoom') {
      return left.value === right.value;
    }
    const max = Math.max(Math.abs(left.value), Math.abs(right.value), 1);
    return Math.abs(left.value - right.value) / max < 0.001;
  };

  const getChangedMetric = async (previous: MetricSnapshot): Promise<MetricSnapshot | undefined> => {
    const urls = await getResourceUrls();
    for (let index = urls.length - 1; index > previous.index; index -= 1) {
      const metric = parseResourceMetric(urls[index]);
      if (metric && metric.kind === previous.metric.kind && !areSameMetric(metric, previous.metric)) {
        return { metric, index };
      }
    }
    return undefined;
  };

  const assertZoomedIn = (before: MapMetric, after: MapMetric) => {
    expect(after.kind).toBe(before.kind);
    if (before.kind === 'zoom' && after.kind === 'zoom') {
      expect(after.value).toBeGreaterThan(before.value);
      return;
    }
    expect(after.value).toBeLessThan(before.value);
  };

  const assertZoomedOut = (before: MapMetric, after: MapMetric) => {
    expect(after.kind).toBe(before.kind);
    if (before.kind === 'zoom' && after.kind === 'zoom') {
      expect(after.value).toBeLessThan(before.value);
      return;
    }
    expect(after.value).toBeGreaterThan(before.value);
  };

  await expect
    .poll(async () => {
      const urls = await getResourceUrls();
      return findLatestMetric(urls) ?? null;
    }, { timeout: 15000 })
    .not.toBeNull();

  const initialMetricSnapshot = findLatestMetric(await getResourceUrls());

  if (initialMetricSnapshot) {
    await zoomInButton.click();

    await expect
      .poll(async () => await getChangedMetric(initialMetricSnapshot), { timeout: 15000 })
      .not.toBeUndefined();

    const zoomedInMetricSnapshot = await getChangedMetric(initialMetricSnapshot);
    if (!zoomedInMetricSnapshot) {
      throw new Error('No changed map metric was detected after clicking the zoom in button.');
    }

    assertZoomedIn(initialMetricSnapshot.metric, zoomedInMetricSnapshot.metric);

    await zoomOutButton.click();

    await expect
      .poll(async () => await getChangedMetric(zoomedInMetricSnapshot), { timeout: 15000 })
      .not.toBeUndefined();

    const zoomedOutMetricSnapshot = await getChangedMetric(zoomedInMetricSnapshot);
    if (!zoomedOutMetricSnapshot) {
      throw new Error('No changed map metric was detected after clicking the zoom out button.');
    }

    assertZoomedOut(zoomedInMetricSnapshot.metric, zoomedOutMetricSnapshot.metric);
    return;
  }

  const initialUrlZoom = parseZoomFromUrl(page.url());
  expect(initialUrlZoom).not.toBeUndefined();

  if (initialUrlZoom === undefined) {
    throw new Error('Could not determine the current map zoom level from either map resource requests or the page URL.');
  }

  await zoomInButton.click();

  await expect
    .poll(() => parseZoomFromUrl(page.url()), { timeout: 15000 })
    .toBeGreaterThan(initialUrlZoom);

  const zoomAfterZoomIn = parseZoomFromUrl(page.url());
  if (zoomAfterZoomIn === undefined) {
    throw new Error('Could not determine the zoom level after clicking the zoom in button.');
  }

  await zoomOutButton.click();

  await expect
    .poll(() => parseZoomFromUrl(page.url()), { timeout: 15000 })
    .toBeLessThan(zoomAfterZoomIn);
});
