// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const printToolbarButton = page.getByRole('button', { name: 'Print Map', exact: true });
    await expect(printToolbarButton).toBeVisible();

    const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar');
    await expect(scaleBar.first()).toBeVisible();

    const titleInput = page.getByLabel(/title/i);

    if (!(await titleInput.isVisible())) {
        const pressed = await printToolbarButton.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToolbarButton.click();
        }
    }

    await expect(titleInput).toBeVisible();

    const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
    if (await printPanelHeading.count()) {
        await expect(printPanelHeading).toBeVisible();
    }

    const printTitle = 'E2E PNG Map Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    const formatButton = page.getByRole('button', { name: /format/i });
    const pngOption = page.getByRole('option', { name: 'PNG', exact: true });

    if (await pngRadio.count()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await formatSelect.count()) {
        await formatSelect.selectOption({ label: 'PNG' });
        await expect(formatSelect).toHaveValue(/png/i);
    } else if (await formatButton.count() && await pngOption.count()) {
        await formatButton.click();
        await pngOption.click();
        await expect(formatButton).toContainText(/png/i);
    } else {
        throw new Error('Could not locate a control to select the PNG export format.');
    }

    let exportButton = page.getByRole('button', { name: 'Export', exact: true });
    if (!(await exportButton.count())) {
        exportButton = page.getByRole('button', { name: 'Print', exact: true });
    }
    if (!(await exportButton.count())) {
        exportButton = page.getByRole('button', { name: 'Download', exact: true });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(async () => await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await fs.readFile(downloadPath!);
    expect([...fileBuffer.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileBuffer.length).toBeGreaterThan(1024);
});
