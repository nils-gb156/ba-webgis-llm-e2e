// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type ResourceEntry = {
    name: string;
    initiatorType: string;
};

type MetricSummary = {
    zoom: number | null;
    bboxArea: number | null;
};

function median(values: number[]): number | null {
    if (values.length === 0) {
        return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function parseTrailingNumber(value: string): number | null {
    const match = value.match(/(\d+)(?!.*\d)/);
    return match ? Number(match[1]) : null;
}

function extractZoom(urlString: string): number | null {
    try {
        const url = new URL(urlString);

        for (const [key, value] of url.searchParams.entries()) {
            const normalizedKey = key.toLowerCase();
            if (normalizedKey === 'z' || normalizedKey === 'zoom' || normalizedKey === 'level') {
                const parsed = Number(value);
                if (Number.isFinite(parsed)) {
                    return parsed;
                }
            }

            if (normalizedKey === 'tilematrix') {
                const parsed = parseTrailingNumber(value);
                if (parsed !== null) {
                    return parsed;
                }
            }
        }

        const pathMatch = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.\w+)?(?:\/)?$/);
        if (pathMatch) {
            return Number(pathMatch[1]);
        }
    } catch {
        return null;
    }

    return null;
}

function extractBboxArea(urlString: string): number | null {
    try {
        const url = new URL(urlString);
        let bboxValue: string | null = null;

        for (const [key, value] of url.searchParams.entries()) {
            if (key.toLowerCase() === 'bbox') {
                bboxValue = value;
                break;
            }
        }

        if (!bboxValue) {
            return null;
        }

        const coordinates = bboxValue.split(',').map((part) => Number(part));
        if (coordinates.length !== 4 || coordinates.some((value) => !Number.isFinite(value))) {
            return null;
        }

        const [minX, minY, maxX, maxY] = coordinates;
        return Math.abs((maxX - minX) * (maxY - minY));
    } catch {
        return null;
    }
}

function isLikelyMapResource(entry: ResourceEntry): boolean {
    const type = entry.initiatorType.toLowerCase();

    if (!['img', 'image', 'fetch', 'xmlhttprequest', 'other'].includes(type)) {
        return false;
    }

    const lowerUrl = entry.name.toLowerCase();

    if (
        lowerUrl.includes('service=wms') ||
        lowerUrl.includes('service=wmts') ||
        lowerUrl.includes('request=getmap') ||
        lowerUrl.includes('request=gettile') ||
        lowerUrl.includes('bbox=') ||
        lowerUrl.includes('tilematrix=')
    ) {
        return true;
    }

    try {
        const url = new URL(entry.name);
        return (
            /\.(png|jpg|jpeg|webp|gif)(?:\?|$)/.test(lowerUrl) &&
            /\/\d+\/\d+\/\d+(?:\/|\.|$)/.test(url.pathname)
        );
    } catch {
        return false;
    }
}

async function getResourceEntries(page: import('@playwright/test').Page): Promise<ResourceEntry[]> {
    return await page.evaluate(() =>
        performance.getEntriesByType('resource').map((entry) => ({
            name: entry.name,
            initiatorType: entry.initiatorType
        }))
    );
}

async function getMapMetric(
    page: import('@playwright/test').Page,
    sinceIndex = 0
): Promise<MetricSummary | null> {
    const resourceEntries = (await getResourceEntries(page)).slice(sinceIndex).filter(isLikelyMapResource);

    const zooms: number[] = [];
    const bboxAreas: number[] = [];

    for (const entry of resourceEntries) {
        const zoom = extractZoom(entry.name);
        if (zoom !== null) {
            zooms.push(zoom);
        }

        const bboxArea = extractBboxArea(entry.name);
        if (bboxArea !== null) {
            bboxAreas.push(bboxArea);
        }
    }

    if (zooms.length === 0 && bboxAreas.length === 0) {
        return null;
    }

    return {
        zoom: median(zooms),
        bboxArea: median(bboxAreas)
    };
}

function isZoomedIn(before: MetricSummary, after: MetricSummary | null): boolean {
    if (!after) {
        return false;
    }

    if (before.zoom !== null && after.zoom !== null) {
        return after.zoom > before.zoom;
    }

    if (before.bboxArea !== null && after.bboxArea !== null) {
        return after.bboxArea < before.bboxArea;
    }

    return false;
}

function isZoomedOut(afterZoomIn: MetricSummary, afterZoomOut: MetricSummary | null): boolean {
    if (!afterZoomOut) {
        return false;
    }

    if (afterZoomIn.zoom !== null && afterZoomOut.zoom !== null) {
        return afterZoomOut.zoom < afterZoomIn.zoom;
    }

    if (afterZoomIn.bboxArea !== null && afterZoomOut.bboxArea !== null) {
        return afterZoomOut.bboxArea > afterZoomIn.bboxArea;
    }

    return false;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const zoomInButton = page.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = page.getByRole('button', { name: /zoom out/i });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    let initialMetric: MetricSummary | null = null;
    await expect
        .poll(async () => {
            initialMetric = await getMapMetric(page);
            return initialMetric !== null && (initialMetric.zoom !== null || initialMetric.bboxArea !== null);
        })
        .toBe(true);

    const resourceCountBeforeZoomIn = (await getResourceEntries(page)).length;

    await zoomInButton.click();

    let zoomInMetric: MetricSummary | null = null;
    await expect
        .poll(async () => {
            zoomInMetric = await getMapMetric(page, resourceCountBeforeZoomIn);
            return initialMetric !== null && isZoomedIn(initialMetric, zoomInMetric);
        })
        .toBe(true);

    const resourceCountBeforeZoomOut = (await getResourceEntries(page)).length;

    await zoomOutButton.click();

    let zoomOutMetric: MetricSummary | null = null;
    await expect
        .poll(async () => {
            zoomOutMetric = await getMapMetric(page, resourceCountBeforeZoomOut);
            return zoomInMetric !== null && isZoomedOut(zoomInMetric, zoomOutMetric);
        })
        .toBe(true);
});
