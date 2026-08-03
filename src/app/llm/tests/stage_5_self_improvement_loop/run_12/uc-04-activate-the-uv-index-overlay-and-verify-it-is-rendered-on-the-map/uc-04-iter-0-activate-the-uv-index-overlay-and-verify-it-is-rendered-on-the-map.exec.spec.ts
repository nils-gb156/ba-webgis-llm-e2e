// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

  const uvIndexRequests: string[] = [];
  const uvIndexRequestPattern = /uv(?:-|_|\s)?index/i;
  const requestTypes = new Set(['image', 'xhr', 'fetch']);

  page.on('request', (request) => {
    const decodedUrl = decodeURIComponent(request.url());
    if (requestTypes.has(request.resourceType()) && uvIndexRequestPattern.test(decodedUrl)) {
      uvIndexRequests.push(decodedUrl);
    }
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();
  await page.waitForLoadState('networkidle');
  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
