// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

const extractZoomFromUrl = (url: string): number | undefined => {
    try {
        const parsedUrl = new URL(url);

        for (const paramName of ['z', 'zoom', 'ZOOM', 'tilematrix', 'TileMatrix', 'TILEMATRIX']) {
            const value = parsedUrl.searchParams.get(paramName);
            if (!value) {
                continue;
            }

            if (/^\d+$/.test(value)) {
                return Number(value);
            }

            const trailingNumberMatch = value.match(/(\d+)$/);
            if (trailingNumberMatch) {
                return Number(trailingNumberMatch[1]);
            }
        }

        const xyzPathMatch = parsedUrl.pathname.match(
            /\/(\d+)\/(\d+)\/(\d+)(?:@[\dx]+)?(?:\.[a-zA-Z0-9]+)?$/
        );
        if (xyzPathMatch) {
            return Number(xyzPathMatch[1]);
        }
    } catch {
        return undefined;
    }

    return undefined;
};

const getMaxZoom = (zoomLevels: number[]): number | undefined =>
    zoomLevels.length > 0 ? Math.max(...zoomLevels) : undefined;

const getMinZoom = (zoomLevels: number[]): number | undefined =>
    zoomLevels.length > 0 ? Math.min(...zoomLevels) : undefined;

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    const observedImageZoomLevels: number[] = [];

    page.on('request', request => {
        if (request.resourceType() !== 'image') {
            return;
        }

        const zoomLevel = extractZoomFromUrl(request.url());
        if (zoomLevel !== undefined) {
            observedImageZoomLevels.push(zoomLevel);
        }
    });

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
    const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    await expect.poll(() => getMaxZoom(observedImageZoomLevels)).toBeDefined();
    const initialZoomLevel = getMaxZoom(observedImageZoomLevels);
    expect(initialZoomLevel).toBeDefined();

    const zoomInStartIndex = observedImageZoomLevels.length;
    await zoomInButton.click();

    await expect
        .poll(() => {
            const newZoomLevels = observedImageZoomLevels.slice(zoomInStartIndex);
            return getMaxZoom(newZoomLevels);
        })
        .toBeGreaterThan(initialZoomLevel!);

    const zoomedInZoomLevel = getMaxZoom(observedImageZoomLevels.slice(zoomInStartIndex));
    expect(zoomedInZoomLevel).toBeDefined();

    const zoomOutStartIndex = observedImageZoomLevels.length;
    await zoomOutButton.click();

    await expect
        .poll(() => {
            const newZoomLevels = observedImageZoomLevels
                .slice(zoomOutStartIndex)
                .filter(zoomLevel => zoomLevel < zoomedInZoomLevel!);
            return getMinZoom(newZoomLevels);
        })
        .toBeLessThan(zoomedInZoomLevel!);
});
