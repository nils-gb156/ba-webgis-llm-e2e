// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await page.waitForLoadState('networkidle');

  const zoomInHandle = await zoomInButton.elementHandle();
  const zoomOutHandle = await zoomOutButton.elementHandle();

  if (!zoomInHandle || !zoomOutHandle) {
    throw new Error('Could not resolve zoom button elements.');
  }

  const mapContainerHandle = await page.evaluateHandle(
    ({ zoomInElement, zoomOutElement }) => {
      const getAncestors = (element: Element): Element[] => {
        const ancestors: Element[] = [];
        let current: Element | null = element;
        while (current) {
          ancestors.push(current);
          current = current.parentElement;
        }
        return ancestors;
      };

      const zoomInAncestors = getAncestors(zoomInElement);
      const zoomOutAncestors = new Set(getAncestors(zoomOutElement));

      for (const ancestor of zoomInAncestors) {
        if (zoomOutAncestors.has(ancestor)) {
          return ancestor;
        }
      }

      return document.body;
    },
    { zoomInElement: zoomInHandle, zoomOutElement: zoomOutHandle }
  );

  const mapContainer = mapContainerHandle.asElement();
  if (!mapContainer) {
    throw new Error('Could not resolve the map container.');
  }

  const mapCanvasHandle = await mapContainer.evaluateHandle((container) => {
    const canvases = Array.from(container.querySelectorAll('canvas')).filter((canvas) => {
      const rect = canvas.getBoundingClientRect();
      const style = window.getComputedStyle(canvas);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    });

    canvases.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return bRect.width * bRect.height - aRect.width * aRect.height;
    });

    return canvases[0] ?? null;
  });

  const mapCanvas = mapCanvasHandle.asElement();
  if (!mapCanvas) {
    throw new Error('Could not find a visible map canvas.');
  }

  await expect
    .poll(async () => {
      const box = await mapCanvas.boundingBox();
      return box ? box.width * box.height : 0;
    })
    .toBeGreaterThan(0);

  const getTransformExtremes = async (): Promise<{
    maxScale: number;
    minScale: number;
    maxDeviation: number;
  }> => {
    return await mapContainer.evaluate((container) => {
      const getScale = (transform: string): number | undefined => {
        if (!transform || transform === 'none') {
          return undefined;
        }

        const matrix3dMatch = transform.match(/^matrix3d\((.+)\)$/);
        if (matrix3dMatch) {
          const values = matrix3dMatch[1].split(',').map((value) => Number(value.trim()));
          if (values.length === 16 && values.every((value) => Number.isFinite(value))) {
            const scaleX = Math.hypot(values[0], values[1], values[2]);
            const scaleY = Math.hypot(values[4], values[5], values[6]);
            return Math.max(scaleX, scaleY);
          }
        }

        const matrixMatch = transform.match(/^matrix\((.+)\)$/);
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map((value) => Number(value.trim()));
          if (values.length === 6 && values.every((value) => Number.isFinite(value))) {
            const [a, b, c, d] = values;
            const scaleX = Math.hypot(a, b);
            const scaleY = Math.hypot(c, d);
            return Math.max(scaleX, scaleY);
          }
        }

        const scaleMatch = transform.match(/scale(?:3d)?\(([^)]+)\)/);
        if (scaleMatch) {
          const values = scaleMatch[1]
            .split(',')
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isFinite(value));
          if (values.length > 0) {
            return Math.max(...values);
          }
        }

        return undefined;
      };

      const elements = [container, ...Array.from(container.querySelectorAll('*'))];
      let maxScale = 1;
      let minScale = 1;

      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          continue;
        }

        const scale = getScale(window.getComputedStyle(element).transform);
        if (scale === undefined) {
          continue;
        }

        maxScale = Math.max(maxScale, scale);
        minScale = Math.min(minScale, scale);
      }

      return {
        maxScale,
        minScale,
        maxDeviation: Math.max(Math.abs(maxScale - 1), Math.abs(minScale - 1))
      };
    });
  };

  const takeCanvasScreenshot = async (): Promise<Buffer> => {
    return await mapCanvas.screenshot();
  };

  const initialCanvas = await takeCanvasScreenshot();

  await zoomInButton.click();

  await expect
    .poll(async () => (await getTransformExtremes()).maxScale, {
      intervals: [50, 100, 150, 250, 500]
    })
    .toBeGreaterThan(1.01);

  await expect
    .poll(async () => (await getTransformExtremes()).maxDeviation, {
      intervals: [50, 100, 150, 250, 500]
    })
    .toBeLessThan(0.01);

  await expect
    .poll(async () => (await takeCanvasScreenshot()).equals(initialCanvas), {
      intervals: [100, 200, 300, 500]
    })
    .toBe(false);

  const zoomedInCanvas = await takeCanvasScreenshot();
  expect(zoomedInCanvas.equals(initialCanvas)).toBe(false);

  await zoomOutButton.click();

  await expect
    .poll(async () => (await getTransformExtremes()).minScale, {
      intervals: [50, 100, 150, 250, 500]
    })
    .toBeLessThan(0.99);

  await expect
    .poll(async () => (await getTransformExtremes()).maxDeviation, {
      intervals: [50, 100, 150, 250, 500]
    })
    .toBeLessThan(0.01);

  await expect
    .poll(async () => (await takeCanvasScreenshot()).equals(zoomedInCanvas), {
      intervals: [100, 200, 300, 500]
    })
    .toBe(false);

  const zoomedOutCanvas = await takeCanvasScreenshot();
  expect(zoomedOutCanvas.equals(zoomedInCanvas)).toBe(false);
});
