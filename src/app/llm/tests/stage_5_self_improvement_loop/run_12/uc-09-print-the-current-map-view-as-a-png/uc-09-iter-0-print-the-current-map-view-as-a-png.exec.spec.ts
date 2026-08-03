// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const titleInput = page.getByRole('textbox', { name: /title/i });
    if (!(await titleInput.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = page.getByRole('combobox', { name: /format/i });
        if (await formatCombobox.isVisible()) {
            try {
                await formatCombobox.selectOption({ label: 'PNG' });
            } catch {
                try {
                    await formatCombobox.selectOption('png');
                } catch {
                    await formatCombobox.selectOption('image/png');
                }
            }
            await expect(formatCombobox).toHaveValue(/png/i);
        } else {
            const formatButton = page.getByRole('button', { name: /format/i });
            await expect(formatButton).toBeVisible();
            await formatButton.click();
            await page.getByRole('option', { name: 'PNG', exact: true }).click();
        }
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: 'Export', exact: true }),
        page.getByRole('button', { name: 'Print', exact: true }),
        page.getByRole('button', { name: 'Download', exact: true }),
        page.getByRole('button', { name: 'Export Map', exact: true }),
        page.getByRole('button', { name: 'Create export file', exact: true }),
        page.getByRole('button', { name: 'Generate', exact: true }),
        page.getByRole('button', { name: 'Create', exact: true }),
        page.getByRole('button', { name: /export|download|generate|create/i })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if (await candidate.isVisible()) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = path.join(os.tmpdir(), `${Date.now()}-${suggestedFilename}`);
    await download.saveAs(downloadPath);
    expect(await download.failure()).toBeNull();

    const fileBuffer = await readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(1000);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
});
