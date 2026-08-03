// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    await page.getByTestId('print-toggle').click();

    let titleInput = page.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = page.getByLabel(/title/i);
    }
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    const pngButton = page.getByRole('button', { name: 'PNG', exact: true });

    if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else if ((await formatCombobox.count()) > 0 && (await formatCombobox.first().isVisible())) {
        await formatCombobox.first().selectOption({ label: 'PNG' });
        await expect(formatCombobox.first()).toHaveValue(/png/i);
    } else {
        await expect(pngButton.first()).toBeVisible();
        await pngButton.first().click();
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: 'Export', exact: true }),
        page.getByRole('button', { name: 'Print', exact: true }),
        page.getByRole('button', { name: 'Download', exact: true }),
        page.getByRole('button', { name: /export/i }),
        page.getByRole('button', { name: /download/i })
    ];

    let exportButton = exportButtonCandidates[0].first();
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
            exportButton = candidate.first();
            break;
        }
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
    ]);

    await expect.poll(() => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const fileBytes = await readFile(filePath!);
    expect(fileBytes.byteLength).toBeGreaterThan(10_000);
    expect([...fileBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
