// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it might be left on from previous tests)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const isMeasurementPanelVisible = await measurementPanel.isVisible();
  if (isMeasurementPanelVisible) {
    await measurementToggle.click();
  }

  // Ensure UV-Index Stations layer is active
  const uvIndexStationsLayer = await isLayerRendered(page, 'UV-Index Stations');
  if (!uvIndexStationsLayer) {
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    // Layer switcher is visible by default, but let's ensure the panel is open
    const layerSwitcherPanel = page.getByTestId('layer-switcher');
    if (!(await layerSwitcherPanel.isVisible())) {
      await layerSwitcherToggle.click();
    }
    // Toggle UV-Index Stations layer
    // The layer switcher lists layers. We need to find the checkbox for UV-Index Stations.
    // Based on UI map, there isn't a specific testid for the checkbox inside layer switcher,
    // but we can use getByRole with exact name.
    // However, looking at the UI map, `layer-switcher` is a panel. The layers inside might not have testids.
    // Let's assume the layer switcher has checkboxes for layers.
    // We will try to find the checkbox by its accessible name "UV-Index Stations".
    // If that fails, we might need to rely on the fact that the layer is operational and we can toggle it.
    // Given the UI map doesn't list specific layer checkboxes, we'll try getByRole('checkbox', { name: 'UV-Index Stations' }).
    // If that's ambiguous, we might need to scope it.
    // Let's try to click the checkbox for UV-Index Stations.
    const uvCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
    if (await uvCheckbox.count() > 0) {
      await uvCheckbox.click();
    } else {
      // Fallback: try to find it in the layer switcher panel
      const layerSwitcher = page.getByTestId('layer-switcher');
      const uvCheckboxInSwitcher = layerSwitcher.getByRole('checkbox', { name: 'UV-Index Stations' });
      if (await uvCheckboxInSwitcher.count() > 0) {
        await uvCheckboxInSwitcher.click();
      }
    }
    // Wait for the layer to be rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  }

  // Ensure EUCOS Ground Stations layer is active
  const eucosLayerRendered = await isLayerRendered(page, 'EUCOS Ground Stations');
  if (!eucosLayerRendered) {
    const layerSwitcher = page.getByTestId('layer-switcher');
    const eucosCheckbox = layerSwitcher.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
    if (await eucosCheckbox.count() > 0) {
      await eucosCheckbox.click();
    } else {
      // Fallback: global search
      const eucosCheckboxGlobal = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
      if (await eucosCheckboxGlobal.count() > 0) {
        await eucosCheckboxGlobal.click();
      }
    }
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  }

  // Ensure info panel is visible
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  // The coordinates are in EPSG:3857. We need to convert them to pixel coordinates for clicking.
  // However, Playwright's click method with position is relative to the element's top-left corner.
  // We need to calculate the pixel position from the EPSG:3857 coordinates.
  // We can use page.evaluate to get the pixel coordinates from the map model.
  const pixelCoordinates = await page.evaluate(({ x, y }: { x: number; y: number }) => {
    const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => [number, number] } } }).__openPioneerMap;
    if (!map) return null;
    return map.olMap.getPixelFromCoordinate([x, y]);
  }, { x: 1188692.84, y: 6767643.28 });

  if (pixelCoordinates) {
    await mapContainer.click({
      position: {
        x: pixelCoordinates[0],
        y: pixelCoordinates[1]
      }
    });
  } else {
    // Fallback: click directly if evaluation fails, though this is risky
    // We'll try to click the map container generally, but this won't target the specific feature.
    // For this test, we assume the evaluation works.
    throw new Error('Could not determine pixel coordinates for the map click.');
  }

  // Wait for the info panel to load the station info for both layers
  // The info panel should display sections for UV-Index Station and EUCOS Ground Station.
  // We'll wait for these sections to be visible.
  // Since there are no specific testids for the sections in the UI map, we'll use getByText or getByRole.
  // We'll look for text "UV-Index Station" and "EUCOS Ground Station" in the info panel.
  
  // Wait for UV-Index Station section
  await expect.poll(async () => {
    const infoPanelText = await infoPanel.textContent();
    return infoPanelText?.includes('UV-Index Station');
  }).toBe(true);

  // Wait for EUCOS Ground Station section
  await expect.poll(async () => {
    const infoPanelText = await infoPanel.textContent();
    return infoPanelText?.includes('EUCOS Ground Station');
  }).toBe(true);

  // Final assertions
  const infoPanelContent = await infoPanel.textContent();
  expect(infoPanelContent).toContain('UV-Index Station');
  expect(infoPanelContent).toContain('EUCOS Ground Station');
});
