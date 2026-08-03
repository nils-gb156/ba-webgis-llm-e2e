// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect
        .poll(async () => (await getMapZoomLevel(page)) !== undefined, { timeout: 10000 })
        .toBe(true);
    await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 10000 }).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations'), { timeout: 10000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 10000 }).toBe(true);

    await page.getByTestId('print-toggle').click();

    const printTitle = 'Current weather map';

    let titleInput = page.getByRole('textbox', { name: /title/i }).first();
    let titleInputFound = false;
    for (const candidate of [
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByPlaceholder(/title/i)
    ]) {
        if ((await candidate.count()) > 0) {
            titleInput = candidate.first();
            titleInputFound = true;
            break;
        }
    }
    if (!titleInputFound) {
        const textboxes = page.getByRole('textbox');
        const textboxCount = await textboxes.count();
        expect(textboxCount).toBeGreaterThan(1);
        titleInput = textboxes.nth(textboxCount - 1);
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);

    const printHeading = page.getByRole('heading', { name: /print/i });
    if ((await printHeading.count()) > 0) {
        await expect(printHeading.first()).toBeVisible();
    }

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio.first()).toBeVisible();
        if (!(await pngRadio.first().isChecked())) {
            await pngRadio.first().click({ force: true });
        }
        await expect(pngRadio.first()).toBeChecked();
    } else {
        let formatControl = page.getByRole('combobox', { name: /format/i }).first();
        let formatControlFound = false;

        for (const candidate of [page.getByRole('combobox', { name: /format/i }), page.getByLabel(/format/i)]) {
            if ((await candidate.count()) > 0) {
                formatControl = candidate.first();
                formatControlFound = true;
                break;
            }
        }

        if (!formatControlFound) {
            const comboboxes = page.getByRole('combobox');
            const comboboxCount = await comboboxes.count();
            if (comboboxCount > 1) {
                formatControl = comboboxes.nth(comboboxCount - 1);
                formatControlFound = true;
            }
        }

        if (formatControlFound) {
            await expect(formatControl).toBeVisible();
            const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());

            if (tagName === 'select') {
                await formatControl.selectOption({ label: 'PNG' });
                await expect(formatControl).toHaveValue(/png/i);
            } else {
                await formatControl.click();
                const pngOption = page.getByRole('option', { name: /^png$/i });
                await expect(pngOption).toBeVisible();
                await pngOption.click();
            }
        } else {
            const pngButton = page.getByRole('button', { name: /^png$/i });
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    let exportButton = page.getByRole('button', { name: /^export$/i }).first();
    let exportButtonFound = false;
    for (const candidate of [
        page.getByRole('button', { name: /^export$/i }),
        page.getByRole('button', { name: /^print$/i }),
        page.getByRole('button', { name: /^download$/i })
    ]) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate.first();
            exportButtonFound = true;
            break;
        }
    }
    if (!exportButtonFound) {
        const genericExportButton = page.getByRole('button', { name: /export|download/i });
        if ((await genericExportButton.count()) > 0) {
            exportButton = genericExportButton.first();
            exportButtonFound = true;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    if (!stream) {
        throw new Error('Expected a downloadable PNG stream.');
    }

    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', reject);
    });

    const fileBuffer = Buffer.concat(chunks);
    expect(fileBuffer.length).toBeGreaterThan(1000);
    expect(fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
});
