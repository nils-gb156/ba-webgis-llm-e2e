// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoToggle = page.getByRole('button', { name: 'Info', exact: true });
  if ((await infoToggle.count()) > 0) {
    const pressed = await infoToggle.first().getAttribute('aria-pressed');
    if (pressed === 'false') {
      await infoToggle.first().click();
    }
  }

  const measurementToggleCandidates = [
    page.getByRole('button', { name: 'Measurement', exact: true }),
    page.getByRole('button', { name: 'Measure', exact: true })
  ];
  for (const measurementToggle of measurementToggleCandidates) {
    if ((await measurementToggle.count()) > 0) {
      const pressed = await measurementToggle.first().getAttribute('aria-pressed');
      if (pressed === 'true') {
        await measurementToggle.first().click();
      }
      break;
    }
  }

  const uvLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if ((await uvLayerCheckbox.count()) > 0) {
    await expect(uvLayerCheckbox.first()).toBeChecked();
  }

  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if ((await eucosLayerCheckbox.count()) > 0) {
    await expect(eucosLayerCheckbox.first()).toBeChecked();
  }

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const getFeatureInfoResponse = page.waitForResponse(
    (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
  );

  const viewportBox = await mapViewport.boundingBox();
  if (!viewportBox) {
    throw new Error('Map viewport is not available for clicking.');
  }

  await mapViewport.click({
    position: {
      x: viewportBox.width / 2,
      y: viewportBox.height / 2
    }
  });

  await getFeatureInfoResponse;

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
