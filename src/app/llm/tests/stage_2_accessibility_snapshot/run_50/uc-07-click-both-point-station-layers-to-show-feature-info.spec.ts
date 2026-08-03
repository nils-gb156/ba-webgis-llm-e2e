// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const coordinateViewer = page.getByTestId('coordinate-viewer');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const normalizeNumberToken = (token: string): number => {
        const cleaned = token.replace(/[^\d,.-]/g, '');
        const dotCount = (cleaned.match(/\./g) || []).length;
        const commaCount = (cleaned.match(/,/g) || []).length;

        let normalized = cleaned;

        if (dotCount > 0 && commaCount > 0) {
            const lastDot = cleaned.lastIndexOf('.');
            const lastComma = cleaned.lastIndexOf(',');
            const decimalSeparator = lastDot > lastComma ? '.' : ',';
            const thousandsSeparator = decimalSeparator === '.' ? /,/g : /\./g;

            normalized = cleaned.replace(thousandsSeparator, '');
            if (decimalSeparator === ',') {
                normalized = normalized.replace(',', '.');
            }
        } else if (commaCount > 1) {
            normalized = cleaned.replace(/,/g, '');
        } else if (dotCount > 1) {
            normalized = cleaned.replace(/\./g, '');
        } else if (commaCount === 1 && dotCount === 0) {
            const index = cleaned.indexOf(',');
            const decimals = cleaned.length - index - 1;
            normalized = decimals === 3 ? cleaned.replace(',', '') : cleaned.replace(',', '.');
        } else if (dotCount === 1 && commaCount === 0) {
            const index = cleaned.indexOf('.');
            const decimals = cleaned.length - index - 1;
            normalized = decimals === 3 ? cleaned.replace('.', '') : cleaned;
        }

        return Number.parseFloat(normalized);
    };

    const parseCoordinatePair = (text: string): { x: number; y: number } | undefined => {
        const tokens = text.match(/-?[\d.,]+/g);
        if (!tokens || tokens.length < 2) {
            return undefined;
        }

        const values = tokens
            .map(normalizeNumberToken)
            .filter((value) => Number.isFinite(value));

        if (values.length < 2) {
            return undefined;
        }

        const largeValues = values.filter((value) => Math.abs(value) > 10000);
        const relevantValues = largeValues.length >= 2 ? largeValues : values;

        if (relevantValues.length < 2) {
            return undefined;
        }

        return { x: relevantValues[0], y: relevantValues[1] };
    };

    const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    };

    const roundPosition = (position: { x: number; y: number }) => {
        return {
            x: Math.round(position.x),
            y: Math.round(position.y)
        };
    };

    const readMapCoordinateAt = async (position: { x: number; y: number }) => {
        let parsedCoordinate: { x: number; y: number } | undefined;

        await expect.poll(async () => {
            await mapContainer.hover({ position: roundPosition(position) });
            const text = (await coordinateViewer.textContent()) ?? '';
            parsedCoordinate = parseCoordinatePair(text);
            return parsedCoordinate !== undefined;
        }).toBe(true);

        return parsedCoordinate!;
    };

    await expect(mapContainer).toBeVisible();
    await expect(coordinateViewer).toBeVisible();

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    const boundingBox = await mapContainer.boundingBox();
    if (!boundingBox) {
        throw new Error('Map container has no bounding box.');
    }

    const targetCoordinate = { x: 1188692.84, y: 6767643.28 };
    const margin = 20;
    const width = boundingBox.width;
    const height = boundingBox.height;
    const probeDelta = Math.max(40, Math.min(width, height) / 10);

    let clickPosition = { x: width / 2, y: height / 2 };

    for (let iteration = 0; iteration < 5; iteration++) {
        const currentCoordinate = await readMapCoordinateAt(clickPosition);

        if (
            Math.abs(currentCoordinate.x - targetCoordinate.x) < 1500 &&
            Math.abs(currentCoordinate.y - targetCoordinate.y) < 1500
        ) {
            break;
        }

        const probeX =
            clickPosition.x + probeDelta <= width - margin
                ? clickPosition.x + probeDelta
                : clickPosition.x - probeDelta;
        const probeY =
            clickPosition.y + probeDelta <= height - margin
                ? clickPosition.y + probeDelta
                : clickPosition.y - probeDelta;

        const xProbeCoordinate = await readMapCoordinateAt({ x: probeX, y: clickPosition.y });
        const yProbeCoordinate = await readMapCoordinateAt({ x: clickPosition.x, y: probeY });

        const unitsPerPixelX = (xProbeCoordinate.x - currentCoordinate.x) / (probeX - clickPosition.x);
        const unitsPerPixelY = (yProbeCoordinate.y - currentCoordinate.y) / (probeY - clickPosition.y);

        expect(Math.abs(unitsPerPixelX)).toBeGreaterThan(0);
        expect(Math.abs(unitsPerPixelY)).toBeGreaterThan(0);

        clickPosition = {
            x: clamp(
                clickPosition.x + (targetCoordinate.x - currentCoordinate.x) / unitsPerPixelX,
                margin,
                width - margin
            ),
            y: clamp(
                clickPosition.y + (targetCoordinate.y - currentCoordinate.y) / unitsPerPixelY,
                margin,
                height - margin
            )
        };
    }

    const finalCoordinate = await readMapCoordinateAt(clickPosition);
    expect(Math.abs(finalCoordinate.x - targetCoordinate.x)).toBeLessThan(2500);
    expect(Math.abs(finalCoordinate.y - targetCoordinate.y)).toBeLessThan(2500);

    await mapContainer.click({ position: roundPosition(clickPosition) });

    await expect(infoPanel).toBeVisible();
    await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/UV-Index Stations?/i);
    await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/EUCOS Ground Stations?/i);
});
