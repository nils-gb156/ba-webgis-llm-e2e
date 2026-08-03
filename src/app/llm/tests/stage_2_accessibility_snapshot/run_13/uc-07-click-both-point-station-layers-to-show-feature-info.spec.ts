// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7 Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const parseLocaleNumber = (value: string): number => {
        let normalized = value.replace(/\s/g, '');

        if (normalized.includes(',') && normalized.includes('.')) {
            if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
                normalized = normalized.replace(/\./g, '').replace(',', '.');
            } else {
                normalized = normalized.replace(/,/g, '');
            }
        } else if (normalized.includes(',')) {
            const parts = normalized.split(',');
            normalized =
                parts.length === 2 && parts[1].length <= 2
                    ? `${parts[0]}.${parts[1]}`
                    : normalized.replace(/,/g, '');
        }

        return Number(normalized);
    };

    const parseCoordinatesFromText = (text: string): [number, number] | undefined => {
        const matches = text.match(/-?\d[\d., ]*/g) ?? [];
        const numbers = matches
            .map((match) => parseLocaleNumber(match.trim()))
            .filter((value) => !Number.isNaN(value));

        if (numbers.length < 2) {
            return undefined;
        }

        return [numbers[0], numbers[1]];
    };

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');
    const coordinateViewer = page.getByTestId('coordinate-viewer');
    const initialExtentButton = page.getByTestId('initial-extent-button');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await initialExtentButton.click();
    await expect(coordinateViewer).toBeVisible();

    const mapSize = await mapContainer.evaluate((element) => {
        const htmlElement = element as HTMLElement;
        return {
            width: htmlElement.clientWidth,
            height: htmlElement.clientHeight
        };
    });

    const margin = Math.max(10, Math.min(40, Math.floor(Math.min(mapSize.width, mapSize.height) / 6)));

    const hoverAndReadCoordinate = async (position: { x: number; y: number }): Promise<[number, number]> => {
        await mapContainer.hover({
            position: {
                x: Math.round(position.x),
                y: Math.round(position.y)
            }
        });

        let coordinate: [number, number] | undefined;

        await expect
            .poll(async () => {
                const text = (await coordinateViewer.textContent()) ?? '';
                coordinate = parseCoordinatesFromText(text);
                return coordinate ? 'ready' : 'waiting';
            })
            .toBe('ready');

        return coordinate!;
    };

    const leftSamplePosition = { x: margin, y: mapSize.height / 2 };
    const rightSamplePosition = { x: mapSize.width - margin, y: mapSize.height / 2 };
    const topSamplePosition = { x: mapSize.width / 2, y: margin };
    const bottomSamplePosition = { x: mapSize.width / 2, y: mapSize.height - margin };

    const leftCoordinate = await hoverAndReadCoordinate(leftSamplePosition);
    const rightCoordinate = await hoverAndReadCoordinate(rightSamplePosition);
    const topCoordinate = await hoverAndReadCoordinate(topSamplePosition);
    const bottomCoordinate = await hoverAndReadCoordinate(bottomSamplePosition);

    expect(Math.abs(rightCoordinate[0] - leftCoordinate[0])).toBeGreaterThan(0);
    expect(Math.abs(bottomCoordinate[1] - topCoordinate[1])).toBeGreaterThan(0);

    const targetMapCoordinate: [number, number] = [1188692.84, 6767643.28];

    const xMin = Math.min(leftCoordinate[0], rightCoordinate[0]);
    const xMax = Math.max(leftCoordinate[0], rightCoordinate[0]);
    const yMin = Math.min(topCoordinate[1], bottomCoordinate[1]);
    const yMax = Math.max(topCoordinate[1], bottomCoordinate[1]);

    expect(targetMapCoordinate[0]).toBeGreaterThanOrEqual(xMin);
    expect(targetMapCoordinate[0]).toBeLessThanOrEqual(xMax);
    expect(targetMapCoordinate[1]).toBeGreaterThanOrEqual(yMin);
    expect(targetMapCoordinate[1]).toBeLessThanOrEqual(yMax);

    const xUnitsPerPixel =
        (rightCoordinate[0] - leftCoordinate[0]) / (rightSamplePosition.x - leftSamplePosition.x);
    const yUnitsPerPixel =
        (bottomCoordinate[1] - topCoordinate[1]) / (bottomSamplePosition.y - topSamplePosition.y);

    const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

    let clickX = leftSamplePosition.x + (targetMapCoordinate[0] - leftCoordinate[0]) / xUnitsPerPixel;
    let clickY = topSamplePosition.y + (targetMapCoordinate[1] - topCoordinate[1]) / yUnitsPerPixel;

    for (let attempt = 0; attempt < 5; attempt++) {
        clickX = clamp(clickX, margin, mapSize.width - margin);
        clickY = clamp(clickY, margin, mapSize.height - margin);

        const observedCoordinate = await hoverAndReadCoordinate({ x: clickX, y: clickY });
        const deltaX = targetMapCoordinate[0] - observedCoordinate[0];
        const deltaY = targetMapCoordinate[1] - observedCoordinate[1];

        if (
            Math.abs(deltaX) <= Math.abs(xUnitsPerPixel) * 2 &&
            Math.abs(deltaY) <= Math.abs(yUnitsPerPixel) * 2
        ) {
            break;
        }

        clickX += deltaX / xUnitsPerPixel;
        clickY += deltaY / yUnitsPerPixel;
    }

    await mapContainer.click({
        position: {
            x: Math.round(clamp(clickX, margin, mapSize.width - margin)),
            y: Math.round(clamp(clickY, margin, mapSize.height - margin))
        }
    });

    await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
    await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
