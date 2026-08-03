// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const footer = page.getByTestId('footer');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();
  await expect(layerSwitcherToggle).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const candidateRatios = [
    { x: 0.56, y: 0.42 },
    { x: 0.52, y: 0.42 },
    { x: 0.60, y: 0.42 },
    { x: 0.56, y: 0.38 },
    { x: 0.56, y: 0.46 },
    { x: 0.52, y: 0.38 },
    { x: 0.60, y: 0.38 },
    { x: 0.52, y: 0.46 },
    { x: 0.60, y: 0.46 }
  ];

  let foundBothStationSections = false;

  for (const ratio of candidateRatios) {
    const position = {
      x: Math.round(mapBox.width * ratio.x),
      y: Math.round(mapBox.height * ratio.y)
    };

    const getFeatureInfoResponse = page
      .waitForResponse(response => /getfeatureinfo/i.test(response.url()) && response.ok(), {
        timeout: 3000
      })
      .catch(() => null);

    await mapContainer.click({ position });
    await getFeatureInfoResponse;

    try {
      await expect(infoPanel).toContainText('UV-Index Station', { timeout: 4000 });
      await expect(infoPanel).toContainText('EUCOS Ground Station', { timeout: 4000 });
      foundBothStationSections = true;
      break;
    } catch {
      // try the next nearby click position
    }
  }

  expect(foundBothStationSections).toBe(true);
  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
