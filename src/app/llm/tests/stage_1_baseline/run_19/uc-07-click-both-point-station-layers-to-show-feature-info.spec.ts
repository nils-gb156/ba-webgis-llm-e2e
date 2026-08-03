// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const findFirstVisible = async (locators: any[]) => {
    for (const locator of locators) {
      if ((await locator.count()) > 0) {
        const first = locator.first();
        if (await first.isVisible()) {
          return first;
        }
      }
    }
    return undefined;
  };

  const ensureToggleButtonState = async (names: string[], desiredPressed: boolean) => {
    const button = await findFirstVisible(
      names.map((name) => page.getByRole('button', { name, exact: true }))
    );

    if (!button) {
      return;
    }

    const ariaPressed = await button.getAttribute('aria-pressed');

    if (ariaPressed === null) {
      if (desiredPressed) {
        await button.click();
      }
      return;
    }

    const isPressed = ariaPressed === 'true';
    if (isPressed !== desiredPressed) {
      await button.click();
    }

    await expect(button).toHaveAttribute('aria-pressed', desiredPressed ? 'true' : 'false');
  };

  const findLayerControl = async (name: string) => {
    return await findFirstVisible([
      page.getByRole('checkbox', { name, exact: true }),
      page.getByRole('switch', { name, exact: true }),
      page.getByRole('radio', { name, exact: true })
    ]);
  };

  await ensureToggleButtonState(['Info', 'Information'], true);
  await ensureToggleButtonState(['Measure', 'Measurement'], false);

  let uvLayerControl = await findLayerControl('UV-Index Stations');
  let eucosLayerControl = await findLayerControl('EUCOS Ground Stations');

  if (!uvLayerControl || !eucosLayerControl) {
    await ensureToggleButtonState(['Layers', 'Layer list'], true);
    uvLayerControl = uvLayerControl ?? (await findLayerControl('UV-Index Stations'));
    eucosLayerControl = eucosLayerControl ?? (await findLayerControl('EUCOS Ground Stations'));
  }

  expect(uvLayerControl).toBeTruthy();
  expect(eucosLayerControl).toBeTruthy();

  await expect(uvLayerControl!).toBeVisible();
  await expect(eucosLayerControl!).toBeVisible();

  if (!(await uvLayerControl!.isChecked())) {
    await uvLayerControl!.click({ force: true });
  }
  await expect(uvLayerControl!).toBeChecked();

  if (!(await eucosLayerControl!.isChecked())) {
    await eucosLayerControl!.click({ force: true });
  }
  await expect(eucosLayerControl!).toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas bounding box is not available.');
  }

  const getFeatureInfoResponse = page
    .waitForResponse((response) => /getfeatureinfo/i.test(response.url()), { timeout: 15000 })
    .catch(() => null);

  await mapCanvas.click({
    position: {
      x: Math.round(mapBox.width / 2),
      y: Math.round(mapBox.height / 2)
    }
  });

  await getFeatureInfoResponse;

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
