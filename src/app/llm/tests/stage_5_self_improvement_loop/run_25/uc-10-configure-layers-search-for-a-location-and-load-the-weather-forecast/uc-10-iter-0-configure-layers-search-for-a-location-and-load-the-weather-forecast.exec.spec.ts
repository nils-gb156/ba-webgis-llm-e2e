// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    await expect(layerSwitcher).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEnabled();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    expect(measurementPressed).not.toBe('true');

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const centerBeforeSelection = await getMapCenter(page);
    if (!centerBeforeSelection) {
        throw new Error('Map center was not available before selecting the geocoder result.');
    }

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const firstSearchResult = page.getByText(/Münster/i).first();
    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return 0;
        }

        const dx = center[0] - centerBeforeSelection[0];
        const dy = center[1] - centerBeforeSelection[1];
        return Math.hypot(dx, dy);
    }).toBeGreaterThan(50000);

    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        return await weatherForecastSection.evaluate((root) => {
            const semanticCounts = [
                root.querySelectorAll('[role="listitem"]').length,
                root.querySelectorAll('li').length,
                root.querySelectorAll('[role="row"]').length,
                root.querySelectorAll('tbody tr').length,
                root.querySelectorAll('article').length
            ].filter((count) => count > 0);

            if (semanticCounts.length > 0) {
                return Math.max(...semanticCounts);
            }

            let maxRepeatedChildren = 0;
            const parents = [root, ...Array.from(root.querySelectorAll('*'))];

            for (const parent of parents) {
                const children = Array.from(parent.children).filter((child) => {
                    return (child.textContent ?? '').trim().length > 0;
                });

                if (children.length < 2) {
                    continue;
                }

                const buckets = new Map<string, number>();

                for (const child of children) {
                    const element = child as HTMLElement;
                    const className =
                        typeof element.className === 'string' ? element.className : '';
                    const signature = `${element.tagName}:${className}`;
                    buckets.set(signature, (buckets.get(signature) ?? 0) + 1);
                }

                for (const count of buckets.values()) {
                    if (count > maxRepeatedChildren) {
                        maxRepeatedChildren = count;
                    }
                }
            }

            if (maxRepeatedChildren > 0) {
                return maxRepeatedChildren;
            }

            return Array.from(root.children).filter((child) => {
                return (child.textContent ?? '').trim().length > 0;
            }).length;
        });
    }).toBe(24);

    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(precipitationCheckbox).toBeChecked();
});
