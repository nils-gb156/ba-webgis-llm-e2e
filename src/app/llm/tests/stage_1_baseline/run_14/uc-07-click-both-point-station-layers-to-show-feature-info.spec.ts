// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    const mapTestIds = ['map', 'map-container', 'main-map'];
    let map = page.locator('canvas').first();
    for (const testId of mapTestIds) {
        const candidate = page.getByTestId(testId);
        if (await candidate.count()) {
            map = candidate;
            break;
        }
    }

    await expect(map).toBeVisible();

    let infoScope = body;
    const infoPanelTestIds = ['info-panel', 'feature-info', 'map-info'];
    for (const testId of infoPanelTestIds) {
        const candidate = page.getByTestId(testId);
        if (await candidate.count()) {
            infoScope = candidate;
            break;
        }
    }
    if (infoScope === body) {
        const infoRegions = ['Info', 'Information', 'Feature Info'];
        for (const name of infoRegions) {
            const candidate = page.getByRole('region', { name, exact: true });
            if (await candidate.count()) {
                infoScope = candidate;
                break;
            }
        }
    }
    if (infoScope !== body) {
        await expect(infoScope).toBeVisible();
    }

    const measurementButtonNames = ['Measure', 'Measurement', 'Measurements'];
    for (const name of measurementButtonNames) {
        const button = page.getByRole('button', { name, exact: true }).first();
        if (await button.count()) {
            if (await button.isVisible().catch(() => false)) {
                const pressed = await button.getAttribute('aria-pressed');
                if (pressed === 'true') {
                    await button.click();
                    await expect(button).toHaveAttribute('aria-pressed', 'false');
                }
            }
            break;
        }
    }

    const ensureLayerChecked = async (name: string) => {
        const checkbox = page.getByRole('checkbox', { name, exact: true }).first();
        if (await checkbox.count()) {
            if (!(await checkbox.isChecked())) {
                await checkbox.click({ force: true });
            }
            await expect(checkbox).toBeChecked();
        }
    };

    await ensureLayerChecked('UV-Index Stations');
    await ensureLayerChecked('EUCOS Ground Stations');

    const featureInfoRequests: string[] = [];
    page.on('request', request => {
        if (/getfeatureinfo/i.test(request.url())) {
            featureInfoRequests.push(request.url());
        }
    });

    const mapBox = await map.boundingBox();
    expect(mapBox).not.toBeNull();

    await map.click({
        position: {
            x: Math.floor(mapBox!.width / 2),
            y: Math.floor(mapBox!.height / 2)
        }
    });

    await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

    const expectSectionVisible = async (name: string) => {
        const heading = infoScope.getByRole('heading', { name, exact: true }).first();
        if (await heading.count()) {
            await expect(heading).toBeVisible();
            return;
        }

        const button = infoScope.getByRole('button', { name, exact: true }).first();
        if (await button.count()) {
            await expect(button).toBeVisible();
            return;
        }

        await expect(infoScope.getByText(name, { exact: true })).toBeVisible();
    };

    await expectSectionVisible('UV-Index Station');
    await expectSectionVisible('EUCOS Ground Station');
});
