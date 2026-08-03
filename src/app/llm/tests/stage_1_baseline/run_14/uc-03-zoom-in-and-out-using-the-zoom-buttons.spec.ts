// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function parseZoomFromUrl(url: string): number | undefined {
    const xyzMatch = url.match(/\/(\d+)\/\d+\/\d+(?:@[0-9]+x)?(?:\.[a-z0-9]+)?(?:\?|$)/i);
    if (xyzMatch) {
        return Number.parseInt(xyzMatch[1], 10);
    }

    const tileMatrixMatch = url.match(/[?&]tilematrix=(?:[^&=:]+[:=])?(\d+)/i);
    if (tileMatrixMatch) {
        return Number.parseInt(tileMatrixMatch[1], 10);
    }

    const zoomParamMatch = url.match(/[?&](?:z|zoom|level|lod)=(\d+)/i);
    if (zoomParamMatch) {
        return Number.parseInt(zoomParamMatch[1], 10);
    }

    return undefined;
}

function getDominantZoomFromUrls(urls: string[]): number | undefined {
    const counts = new Map<number, number>();

    for (const url of urls) {
        const zoom = parseZoomFromUrl(url);
        if (zoom !== undefined) {
            counts.set(zoom, (counts.get(zoom) ?? 0) + 1);
        }
    }

    let dominantZoom: number | undefined;
    let dominantCount = 0;

    for (const [zoom, count] of counts.entries()) {
        if (count > dominantCount) {
            dominantZoom = zoom;
            dominantCount = count;
        }
    }

    return dominantZoom;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByRole('button', { name: /^(\+|Zoom in)$/ });
    const zoomOutButton = page.getByRole('button', { name: /^(?:[−-]|Zoom out)$/ });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    const getPerformanceResourceUrls = async () =>
        await page.evaluate(() =>
            performance.getEntriesByType('resource').map((entry) => entry.name)
        );

    let initialZoom: number | undefined;
    await expect.poll(async () => {
        initialZoom = getDominantZoomFromUrls(await getPerformanceResourceUrls());
        return initialZoom ?? null;
    }).not.toBeNull();

    if (initialZoom === undefined) {
        throw new Error('Could not determine the initial map zoom level from tile requests.');
    }

    const zoomInRequestUrls: string[] = [];
    const zoomInRequestListener = (request: Parameters<typeof page.on>[1] extends (arg: infer T) => void ? T : never) => {
        if (parseZoomFromUrl(request.url()) !== undefined) {
            zoomInRequestUrls.push(request.url());
        }
    };

    page.on('request', zoomInRequestListener);
    const zoomInResponsePromise = page.waitForResponse((response) => {
        return response.ok() && parseZoomFromUrl(response.url()) !== undefined;
    });

    await zoomInButton.click();
    await zoomInResponsePromise;

    let zoomedInZoom: number | undefined;
    await expect.poll(() => {
        zoomedInZoom = getDominantZoomFromUrls(zoomInRequestUrls);
        return zoomedInZoom ?? Number.NEGATIVE_INFINITY;
    }).toBeGreaterThan(initialZoom);

    page.off('request', zoomInRequestListener);

    if (zoomedInZoom === undefined) {
        throw new Error('Could not determine the zoomed-in map zoom level from tile requests.');
    }

    const zoomOutRequestUrls: string[] = [];
    const zoomOutRequestListener = (request: Parameters<typeof page.on>[1] extends (arg: infer T) => void ? T : never) => {
        if (parseZoomFromUrl(request.url()) !== undefined) {
            zoomOutRequestUrls.push(request.url());
        }
    };

    page.on('request', zoomOutRequestListener);
    const zoomOutResponsePromise = page.waitForResponse((response) => {
        return response.ok() && parseZoomFromUrl(response.url()) !== undefined;
    });

    await zoomOutButton.click();
    await zoomOutResponsePromise;

    await expect.poll(() => {
        const zoomedOutZoom = getDominantZoomFromUrls(zoomOutRequestUrls);
        return zoomedOutZoom ?? Number.POSITIVE_INFINITY;
    }).toBeLessThan(zoomedInZoom);

    page.off('request', zoomOutRequestListener);
});
