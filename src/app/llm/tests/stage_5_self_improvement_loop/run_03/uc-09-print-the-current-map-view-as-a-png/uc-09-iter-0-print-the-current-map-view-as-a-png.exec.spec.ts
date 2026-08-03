// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const titleInputByRole = page.getByRole('textbox', { name: /title/i }).first();
    const titleInputByLabel = page.getByLabel(/title/i).first();
    const titleInputByPlaceholder = page.getByPlaceholder(/title/i).first();

    if (
        !(await titleInputByRole.isVisible()) &&
        !(await titleInputByLabel.isVisible()) &&
        !(await titleInputByPlaceholder.isVisible())
    ) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    let titleInput = titleInputByRole;
    if (await titleInputByRole.isVisible()) {
        titleInput = titleInputByRole;
    } else if (await titleInputByLabel.isVisible()) {
        titleInput = titleInputByLabel;
    } else {
        titleInput = titleInputByPlaceholder;
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'use-case-9-current-map-view';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i }).first();
    const formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
    const pngButton = page.getByRole('button', { name: /^PNG$/i }).first();

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await formatCombobox.isVisible()) {
        const tagName = await formatCombobox.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            await formatCombobox.selectOption({ label: 'PNG' });
            await expect(formatCombobox).toHaveValue(/png/i);
        } else {
            await formatCombobox.click();
            const pngOption = page.getByRole('option', { name: /^PNG$/i }).first();
            await expect(pngOption).toBeVisible();
            await pngOption.click();
            await expect(formatCombobox).toContainText(/png/i);
        }
    } else {
        await expect(pngButton).toBeVisible();
        await pngButton.click();
        const pressed = await pngButton.getAttribute('aria-pressed');
        if (pressed !== null) {
            await expect(pngButton).toHaveAttribute('aria-pressed', 'true');
        }
    }

    let exportButton = page.getByRole('button', { name: /export/i }).first();
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /^Print$/i }).first();
    }
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /download/i }).first();
    }
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /create/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Expected a downloaded PNG file to be available on disk.');
    }

    const fileContents = await readFile(downloadPath);
    expect(fileContents.length).toBeGreaterThan(8);
    expect(fileContents.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
});
