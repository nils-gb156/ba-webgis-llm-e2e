// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapViewport = page.locator('.ol-viewport').first();
    await expect(mapViewport).toBeVisible();

    const uvStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

    if ((await uvStationsCheckbox.count()) === 0 || (await eucosStationsCheckbox.count()) === 0) {
        const layersButton = page.getByRole('button', { name: 'Layers', exact: true });
        if ((await layersButton.count()) > 0) {
            const pressed = await layersButton.first().getAttribute('aria-pressed');
            if (pressed !== 'true') {
                await layersButton.first().click();
            }
        }
    }

    await expect(uvStationsCheckbox).toBeVisible();
    if (!(await uvStationsCheckbox.isChecked())) {
        await uvStationsCheckbox.click({ force: true });
    }
    await expect(uvStationsCheckbox).toBeChecked();

    await expect(eucosStationsCheckbox).toBeVisible();
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    const measureButton = page.getByRole('button', { name: 'Measure', exact: true });
    if ((await measureButton.count()) > 0) {
        const pressed = await measureButton.first().getAttribute('aria-pressed');
        if (pressed === 'true') {
            await measureButton.first().click();
            await expect(measureButton.first()).toHaveAttribute('aria-pressed', 'false');
        }
    }

    const box = await mapViewport.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map viewport bounding box is not available.');
    }

    await mapViewport.click({
        position: {
            x: Math.round(box.width / 2),
            y: Math.round(box.height / 2)
        }
    });

    await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
    await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
