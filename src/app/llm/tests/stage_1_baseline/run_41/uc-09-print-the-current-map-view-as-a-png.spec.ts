// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapCanvas = page.locator('canvas').first();
    await expect(mapCanvas).toBeVisible();

    const scaleLine = page.locator('.ol-scale-line');
    const scaleBar = page.locator('.ol-scale-bar');
    if (await scaleLine.count()) {
        await expect(scaleLine.first()).toBeVisible();
    } else if (await scaleBar.count()) {
        await expect(scaleBar.first()).toBeVisible();
    }

    const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
    await expect(printMapButton).toBeVisible();

    const titleCandidates = [
        page.getByRole('textbox', { name: 'Title', exact: true }),
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel('Title', { exact: true }),
        page.getByLabel(/title/i)
    ];

    let titleInput = titleCandidates[0];
    for (const candidate of titleCandidates) {
        if (await candidate.count()) {
            titleInput = candidate.first();
            break;
        }
    }

    if (!(await titleInput.isVisible())) {
        const pressed = await printMapButton.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printMapButton.click();
        }
    }

    await expect(titleInput).toBeVisible();

    const dialogWithTitle = page.getByRole('dialog').filter({ has: titleInput });
    const regionWithTitle = page.getByRole('region').filter({ has: titleInput });
    const formWithTitle = page.locator('form').filter({ has: titleInput });

    let panelScope = page.locator('body');
    if (await dialogWithTitle.count()) {
        panelScope = dialogWithTitle.first();
    } else if (await regionWithTitle.count()) {
        panelScope = regionWithTitle.first();
    } else if (await formWithTitle.count()) {
        panelScope = formWithTitle.first();
    }

    await titleInput.fill('E2E PNG Print');

    const pngRadio = panelScope.getByRole('radio', { name: 'PNG', exact: true });
    const formatCombobox = panelScope.getByRole('combobox', { name: /format/i });

    if (await pngRadio.count()) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.selectOption('png');
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    const exportButtonCandidates = [
        panelScope.getByRole('button', { name: 'Export', exact: true }),
        panelScope.getByRole('button', { name: 'Download', exact: true }),
        panelScope.getByRole('button', { name: 'Create printout', exact: true }),
        panelScope.getByRole('button', { name: 'Create Printout', exact: true }),
        panelScope.getByRole('button', { name: 'Print', exact: true })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if (await candidate.count()) {
            exportButton = candidate.first();
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(async () => await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await readFile(downloadPath!);
    expect(fileBuffer.length).toBeGreaterThan(1000);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);

    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
});
