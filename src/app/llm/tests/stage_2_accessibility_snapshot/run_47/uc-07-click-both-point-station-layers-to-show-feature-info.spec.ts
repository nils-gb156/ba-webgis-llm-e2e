// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const coordinateViewer = page.getByTestId('coordinate-viewer');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(coordinateViewer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    const parseCoordinateText = (text: string | null): [number, number] | undefined => {
        if (!text) {
            return undefined;
        }

        const values = [...text.matchAll(/-?\d[\d,.]*/g)]
            .map((match) => Number(match[0].replace(/,/g, '')))
            .filter((value) => !Number.isNaN(value));

        if (values.length < 2) {
            return undefined;
        }

        return [values[0], values[1]];
    };

    const getMapCoordinateAt = async (
        relativeX: number,
        relativeY: number,
        previous?: [number, number]
    ): Promise<[number, number]> => {
        let coordinate: [number, number] | undefined;

        await expect
            .poll(async () => {
                const box = await mapContainer.boundingBox();
                if (!box) {
                    return false;
                }

                await page.mouse.move(box.x + relativeX, box.y + relativeY);
                coordinate = parseCoordinateText(await coordinateViewer.textContent());

                if (!coordinate) {
                    return false;
                }

                if (
                    previous &&
                    Math.abs(coordinate[0] - previous[0]) < 100 &&
                    Math.abs(coordinate[1] - previous[1]) < 100
                ) {
                    return false;
                }

                return true;
            })
            .toBe(true);

        return coordinate!;
    };

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const sampleLeftX = box.width * 0.35;
    const sampleRightX = box.width * 0.65;
    const sampleCenterX = box.width * 0.5;
    const sampleMidY = box.height * 0.55;
    const sampleTopY = box.height * 0.35;
    const sampleBottomY = box.height * 0.75;

    const leftCoord = await getMapCoordinateAt(sampleLeftX, sampleMidY);
    const rightCoord = await getMapCoordinateAt(sampleRightX, sampleMidY, leftCoord);
    const topCoord = await getMapCoordinateAt(sampleCenterX, sampleTopY, rightCoord);
    const bottomCoord = await getMapCoordinateAt(sampleCenterX, sampleBottomY, topCoord);

    const resolutionX = (rightCoord[0] - leftCoord[0]) / (sampleRightX - sampleLeftX);
    const resolutionY = (bottomCoord[1] - topCoord[1]) / (sampleBottomY - sampleTopY);

    expect(resolutionX).not.toBe(0);
    expect(resolutionY).not.toBe(0);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    let clickX = clamp(sampleLeftX + (targetCoordinate[0] - leftCoord[0]) / resolutionX, 1, box.width - 1);
    let clickY = clamp(sampleTopY + (targetCoordinate[1] - topCoord[1]) / resolutionY, 1, box.height - 1);

    for (let i = 0; i < 2; i++) {
        const currentCoordinate = await getMapCoordinateAt(clickX, clickY);
        clickX = clamp(clickX + (targetCoordinate[0] - currentCoordinate[0]) / resolutionX, 1, box.width - 1);
        clickY = clamp(clickY + (targetCoordinate[1] - currentCoordinate[1]) / resolutionY, 1, box.height - 1);
    }

    const finalHoverCoordinate = await getMapCoordinateAt(clickX, clickY);
    expect(Math.abs(finalHoverCoordinate[0] - targetCoordinate[0])).toBeLessThan(5000);
    expect(Math.abs(finalHoverCoordinate[1] - targetCoordinate[1])).toBeLessThan(5000);

    await mapContainer.click({
        position: {
            x: clickX,
            y: clickY
        }
    });

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
    await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
