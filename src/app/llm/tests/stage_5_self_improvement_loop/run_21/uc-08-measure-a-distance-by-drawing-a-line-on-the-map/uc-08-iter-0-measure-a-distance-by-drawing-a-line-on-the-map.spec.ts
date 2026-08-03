// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const appRoot = page.getByRole('application', { name: 'webgis map' });
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

    const measurementPanelCandidates = [
        page.getByRole('dialog', { name: 'Measurement', exact: true }),
        page.getByRole('region', { name: 'Measurement', exact: true }),
        page.getByRole('group', { name: 'Measurement', exact: true }),
        page.getByRole('dialog').filter({ has: measurementHeading }),
        page.getByRole('region').filter({ has: measurementHeading }),
        page.getByRole('group').filter({ has: measurementHeading })
    ];

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const measurementPanelAlreadyVisible =
        (await measurementHeading.isVisible()) ||
        (await measurementPanelCandidates[0].first().isVisible()) ||
        (await measurementPanelCandidates[1].first().isVisible()) ||
        (await measurementPanelCandidates[2].first().isVisible()) ||
        (await measurementPanelCandidates[3].first().isVisible()) ||
        (await measurementPanelCandidates[4].first().isVisible()) ||
        (await measurementPanelCandidates[5].first().isVisible());

    if (!measurementPanelAlreadyVisible) {
        await measurementToggle.click();
    }

    await expect.poll(async () => {
        if (await measurementHeading.isVisible()) {
            return true;
        }

        for (const candidate of measurementPanelCandidates) {
            if (await candidate.first().isVisible()) {
                return true;
            }
        }

        return false;
    }).toBe(true);

    let measurementPanel = appRoot;
    for (const candidate of measurementPanelCandidates) {
        if (await candidate.first().isVisible()) {
            measurementPanel = candidate.first();
            break;
        }
    }

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: { x: box.width * 0.42, y: box.height * 0.60 }
    });
    await mapContainer.click({
        position: { x: box.width * 0.50, y: box.height * 0.54 }
    });
    await mapContainer.click({
        position: { x: box.width * 0.58, y: box.height * 0.48 }
    });
    await mapContainer.dblclick({
        position: { x: box.width * 0.66, y: box.height * 0.42 }
    });

    await expect.poll(async () => {
        return ((await measurementPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    }).toMatch(/\b\d+(?:[.,]\d+)?\s*(m|km)\b/i);
});
