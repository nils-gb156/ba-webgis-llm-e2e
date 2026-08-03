// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const getResourceUrls = async (): Promise<string[]> => {
    return await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name)
    );
  };

  const extractZoomFromUrl = (url: string): number | undefined => {
    try {
      const parsed = new URL(url);

      for (const [key, value] of parsed.searchParams.entries()) {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey === 'z' || normalizedKey === 'zoom' || normalizedKey === 'tilematrix') {
          const numericPart = value.match(/(\d{1,2})(?!.*\d)/)?.[1];
          if (numericPart !== undefined) {
            return Number(numericPart);
          }
        }
      }

      const pathMatch = parsed.pathname.match(/\/(\d{1,2})\/\d+\/\d+(?:@[\dx]+)?(?:\.\w+)?$/);
      if (pathMatch?.[1] !== undefined) {
        return Number(pathMatch[1]);
      }
    } catch {
      return undefined;
    }

    return undefined;
  };

  const deriveZoomFromUrls = (urls: string[]): number | undefined => {
    const counts = new Map<number, number>();

    for (const url of urls) {
      const zoom = extractZoomFromUrl(url);
      if (zoom !== undefined) {
        counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
      }
    }

    const mostCommonZoom = [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return b[0] - a[0];
    })[0];

    return mostCommonZoom?.[0];
  };

  const deriveZoomSince = async (baselineCount: number): Promise<number | undefined> => {
    const urls = await getResourceUrls();
    const newUrls = urls.slice(baselineCount);
    return deriveZoomFromUrls(newUrls) ?? deriveZoomFromUrls(urls);
  };

  const zoomInButton = page.getByRole('button', { name: /^(Zoom in|\+)$/ });
  const zoomOutButton = page.getByRole('button', { name: /^(Zoom out|−|-)$/ });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const initialResourceUrls = await getResourceUrls();
  const initialZoom = deriveZoomFromUrls(initialResourceUrls);

  expect(
    initialZoom,
    'Could not determine the initial map zoom level from loaded map resources.'
  ).toBeDefined();

  const beforeZoomInResourceCount = initialResourceUrls.length;
  await zoomInButton.click();

  await expect
    .poll(async () => (await getResourceUrls()).length, {
      message: 'Expected additional map resources to load after clicking the zoom in button.'
    })
    .toBeGreaterThan(beforeZoomInResourceCount);

  await expect
    .poll(() => deriveZoomSince(beforeZoomInResourceCount), {
      message: 'Expected the map zoom level to be higher after clicking the zoom in button.'
    })
    .toBeGreaterThan(initialZoom as number);

  const resourceUrlsAfterZoomIn = await getResourceUrls();
  const zoomAfterIn = (deriveZoomFromUrls(resourceUrlsAfterZoomIn.slice(beforeZoomInResourceCount)) ??
    deriveZoomFromUrls(resourceUrlsAfterZoomIn)) as number;

  const beforeZoomOutResourceCount = resourceUrlsAfterZoomIn.length;
  await zoomOutButton.click();

  await expect
    .poll(async () => (await getResourceUrls()).length, {
      message: 'Expected additional map resources to load after clicking the zoom out button.'
    })
    .toBeGreaterThan(beforeZoomOutResourceCount);

  await expect
    .poll(() => deriveZoomSince(beforeZoomOutResourceCount), {
      message: 'Expected the map zoom level to be lower after clicking the zoom out button.'
    })
    .toBeLessThan(zoomAfterIn);
});
