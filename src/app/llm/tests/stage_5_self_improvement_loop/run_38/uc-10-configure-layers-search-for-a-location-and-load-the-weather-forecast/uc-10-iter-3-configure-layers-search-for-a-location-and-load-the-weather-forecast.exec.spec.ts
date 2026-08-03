// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('precipitation-legend')).toHaveCount(0);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application startup.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toHaveCount(0);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = page.getByTestId('geocoder-result-item-0');
    await expect(firstSearchResult).toBeVisible({ timeout: 15000 });
    await expect(firstSearchResult).toContainText(/Münster/i);
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return 0;
            }

            const dx = center[0] - initialCenter[0];
            const dy = center[1] - initialCenter[1];
            return Math.hypot(dx, dy);
        }, { timeout: 15000 })
        .toBeGreaterThan(50000);

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            if (!coordinate) {
                return Number.POSITIVE_INFINITY;
            }

            const muensterApproximate3857: [number, number] = [849000, 6790000];
            const dx = coordinate[0] - muensterApproximate3857[0];
            const dy = coordinate[1] - muensterApproximate3857[1];
            return Math.hypot(dx, dy);
        }, { timeout: 15000 })
        .toBeLessThan(100000);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            const coordinate = await getHighlightedCoordinate(page);
            if (!center || !coordinate) {
                return Number.POSITIVE_INFINITY;
            }

            const dx = center[0] - coordinate[0];
            const dy = center[1] - coordinate[1];
            return Math.hypot(dx, dy);
        }, { timeout: 15000 })
        .toBeLessThan(20000);

    const highlightedCoordinate = await getHighlightedCoordinate(page);
    if (!highlightedCoordinate) {
        throw new Error('The selected geocoder result did not create a highlighted map position.');
    }

    const highlightPixel = await page.evaluate((coordinate: [number, number]) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                };
            };
        }).__openPioneerMap;

        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? ([pixel[0], pixel[1]] as [number, number])
            : undefined;
    }, highlightedCoordinate);

    if (!highlightPixel) {
        throw new Error('Could not determine the pixel position of the selected map location.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(highlightPixel[0]),
            y: Math.round(highlightPixel[1]),
        },
    });

    const countForecastEntries = async (): Promise<number> => {
        return weatherForecastSection.evaluate((section) => {
            const tableRows = section.querySelectorAll('tbody tr').length;
            if (tableRows > 0) {
                return tableRows;
            }

            const roleRows = section.querySelectorAll('[role="row"]').length;
            if (roleRows > 0) {
                const columnHeaders = section.querySelectorAll('[role="columnheader"]').length;
                return columnHeaders > 0 ? roleRows - 1 : roleRows;
            }

            const listItems = section.querySelectorAll('[role="listitem"], li').length;
            if (listItems > 0) {
                return listItems;
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) {
                return articles;
            }

            const candidateParents = [section, ...Array.from(section.querySelectorAll('div, section, ul, ol'))];
            for (const parent of candidateParents) {
                const children = Array.from(parent.children);
                if (children.length < 24) {
                    continue;
                }

                const signatureCount = new Map<string, number>();
                for (const child of children) {
                    const element = child as HTMLElement;
                    const className =
                        typeof element.className === 'string'
                            ? element.className
                            : Array.from(element.classList).join(' ');
                    const signature = `${child.tagName}|${child.getAttribute('role') ?? ''}|${className}`;
                    signatureCount.set(signature, (signatureCount.get(signature) ?? 0) + 1);
                }

                if ([...signatureCount.values()].some((count) => count === 24)) {
                    return 24;
                }
            }

            const text = section.textContent ?? '';

            const hhmmMatches = Array.from(text.matchAll(/\b([01]?\d|2[0-3]):00\b/g)).map((match) =>
                match[1].padStart(2, '0')
            );
            if (new Set(hhmmMatches).size === 24) {
                return 24;
            }

            const hourWordMatches = Array.from(text.matchAll(/\b([01]?\d|2[0-3])\s*(?:Uhr|h)\b/g)).map((match) =>
                match[1].padStart(2, '0')
            );
            if (new Set(hourWordMatches).size === 24) {
                return 24;
            }

            return 0;
        });
    };

    await expect.poll(countForecastEntries, { timeout: 20000 }).toBe(24);
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toHaveCount(0);
    await expect(weatherForecastSection.getByText(/Fehler beim Laden der Wetterdaten/i)).toHaveCount(0);
});
