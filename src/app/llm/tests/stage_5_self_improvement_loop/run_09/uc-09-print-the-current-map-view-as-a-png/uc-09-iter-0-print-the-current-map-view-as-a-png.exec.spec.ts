// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToolbarButton = page.getByRole('button', { name: 'Print Map', exact: true });
    await expect(printToolbarButton).toBeVisible();

    const titleInput = page.getByRole('textbox', { name: /title/i });

    if (!(await titleInput.isVisible())) {
        const pressed = await printToolbarButton.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToolbarButton.click();
        }
    }

    await expect(titleInput).toBeVisible();

    const printDialog = page.getByRole('dialog');
    if ((await printDialog.count()) > 0) {
        await expect(printDialog.first()).toBeVisible();
    }

    const printTitle = 'Current map view PNG export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = page.getByRole('combobox', { name: /format/i });
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.selectOption({ value: 'png' });
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    const downloadPromise = page.waitForEvent('download');

    const exportButton = page.getByRole('button', { name: /^export$/i });
    const printButton = page.getByRole('button', { name: /^print$/i });

    if (await exportButton.isVisible()) {
        await exportButton.click();
    } else {
        await expect(printButton).toBeVisible();
        await printButton.click();
    }

    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBytes = await readFile(downloadPath!);
    expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(fileBytes.byteLength).toBeGreaterThan(5_000);
});
