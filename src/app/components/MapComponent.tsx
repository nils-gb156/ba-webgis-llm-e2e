// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import React, { useEffect, useRef, useState, useId } from "react";
import { Box, Flex, Separator } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { LuMenu, LuImages, LuInfo, LuRuler, LuPrinter } from "react-icons/lu";
import { Toc } from "@open-pioneer/toc";
import { Legend } from "@open-pioneer/legend";
import { Measurement } from "@open-pioneer/measurement";
import { Printing } from "@open-pioneer/printing";
import { InfoPanel } from "./InfoPanel";
import type { UviFeatureInfo } from "./UviStationInfo";
import type { EucosFeatureInfo } from "./EucosStationInfo";
import { GeocoderSearch } from "./GeocoderSearch";
import { Point } from "ol/geom";
import { transform } from "ol/proj";
import TileWMS from "ol/source/TileWMS";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import type BaseEvent from "ol/events/Event";

const MAP_ID = "main";
const UVI_LAYER_TITLE = "UV-Index Stations";
const EUCOS_LAYER_TITLE = "EUCOS Ground Stations";

// Recursively walks the (possibly nested) OpenLayers layer tree and returns the
// first layer whose "title" property matches. Used to locate the WMS station
// layers without holding direct references to them.
function findLayerByTitle(layerOrGroup: unknown, title: string): unknown | undefined {
    const layer = layerOrGroup as { get?: (key: string) => unknown; getLayers?: () => unknown };
    if (layer?.get?.("title") === title) {
        return layerOrGroup;
    }

    const layersCollection = layer?.getLayers?.() as { getArray?: () => unknown[] } | undefined;
    const children = layersCollection?.getArray?.() ?? [];
    for (const child of children) {
        const match = findLayerByTitle(child, title);
        if (match) {
            return match;
        }
    }

    return undefined;
}

// Main map view and orchestrator: renders the OpenLayers map, the tool buttons,
// the searchable geocoder and the info/legend/measurement panels, and wires map
// clicks to weather forecasts and WMS station queries.
export function MapComponent() {
    const { map } = useMapModel(MAP_ID);
    // Visibility toggles for the four UI panels (layer switcher, legend, info, measurement).
    const [tocIsActive, setTocIsActive] = useState<boolean>(true);
    const [legendIsActive, setLegendIsActive] = useState<boolean>(true);
    const [infoPanelIsActive, setInfoPanelisActive] = useState<boolean>(true);
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const [printingIsActive, setPrintingIsActive] = useState<boolean>(false);
    // State for the draggable measurement panel.
    const measurementTitleId = useId();
    const [measurePos, setMeasurePos] = useState<{ x: number; y: number } | null>(null);
    const measureDragRef = useRef<{
        startX: number;
        startY: number;
        origX: number;
        origY: number;
    } | null>(null);
    // State for the draggable printing panel.
    const printingTitleId = useId();
    const [printingPos, setPrintingPos] = useState<{ x: number; y: number } | null>(null);
    const printingDragRef = useRef<{
        startX: number;
        startY: number;
        origX: number;
        origY: number;
    } | null>(null);
    // The location the user clicked, in both lat/lon and the map's projection.
    const [clickedLocation, setClickedLocation] = useState<
        { coordinate: [number, number]; mapCoordinate: [number, number] } | undefined
    >(undefined);
    // GetFeatureInfo results for the two WMS station layers.
    const [uviFeatureInfo, setUviFeatureInfo] = useState<UviFeatureInfo>({ status: "idle" });
    const [eucosFeatureInfo, setEucosFeatureInfo] = useState<EucosFeatureInfo>({ status: "idle" });
    const [uviVisible, setUviVisible] = useState(true);
    const [eucosVisible, setEucosVisible] = useState(true);
    // Cached references to the station layers/sources, populated once the map loads.
    const uviSourceRef = useRef<TileWMS | null>(null);
    // The EUCOS layer is a WFS vector layer; we keep a reference to the OpenLayers
    // layer instance so feature queries can be scoped to it via a layer filter.
    const eucosLayerInstanceRef = useRef<unknown>(null);
    const uviLayerRef = useRef<{
        getVisible?: () => boolean;
        on?: (event: string, handler: () => void) => void;
        un?: (event: string, handler: () => void) => void;
    } | null>(null);
    const eucosLayerRef = useRef<{
        getVisible?: () => boolean;
        on?: (event: string, handler: () => void) => void;
        un?: (event: string, handler: () => void) => void;
    } | null>(null);

    useEffect(() => {
        // Expose the map model on globalThis so E2E tests can inspect the actual
        // OpenLayers state (rendered layers, visibility, features) which is not
        // accessible through the DOM (the map renders into a canvas).
        (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap = map;
        return () => {
            delete (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap;
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        // Once the map is ready, look up the two WMS station layers and cache their
        // sources/layers in refs so click handlers can query them later.
        type OlLayer = {
            getSource?: () => TileWMS | undefined;
            getVisible?: () => boolean;
            on?: (event: string, handler: () => void) => void;
            un?: (event: string, handler: () => void) => void;
        };
        const uviLayer = findLayerByTitle(map.olMap, UVI_LAYER_TITLE) as OlLayer | undefined;
        uviSourceRef.current = uviLayer?.getSource?.() ?? null;
        uviLayerRef.current = uviLayer ?? null;
        setUviVisible(uviLayer?.getVisible?.() ?? true);

        const eucosLayer = findLayerByTitle(map.olMap, EUCOS_LAYER_TITLE) as OlLayer | undefined;
        eucosLayerInstanceRef.current = eucosLayer ?? null;
        eucosLayerRef.current = eucosLayer ?? null;
        setEucosVisible(eucosLayer?.getVisible?.() ?? true);
    }, [map]);

    useEffect(() => {
        const uviLayer = uviLayerRef.current;
        const eucosLayer = eucosLayerRef.current;

        // Keep the local visibility state in sync when the user toggles the
        // station layers via the layer switcher (TOC).
        const onUviChange = () => setUviVisible(uviLayer?.getVisible?.() ?? true);
        const onEucosChange = () => setEucosVisible(eucosLayer?.getVisible?.() ?? true);

        uviLayer?.on?.("change:visible", onUviChange);
        eucosLayer?.on?.("change:visible", onEucosChange);

        return () => {
            uviLayer?.un?.("change:visible", onUviChange);
            eucosLayer?.un?.("change:visible", onEucosChange);
        };
    }, [map]);

    function toggleToc() {
        setTocIsActive(!tocIsActive);
    }

    function toggleLegend() {
        setLegendIsActive(!legendIsActive);
    }

    function toggleInfoPanel() {
        setInfoPanelisActive(!infoPanelIsActive);
    }

    function toggleMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

    function togglePrinting() {
        setPrintingIsActive(!printingIsActive);
    }

    function handleMeasureDragStart(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        // Record the pointer and panel positions so the panel can follow the cursor.
        const panel = (e.currentTarget as HTMLElement).closest(
            "[data-measurement-panel]"
        ) as HTMLElement | null;
        const rect = panel?.getBoundingClientRect();
        if (!rect) return;
        measureDragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: rect.left,
            origY: rect.top
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handleMeasureDragMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!measureDragRef.current) return;
        e.preventDefault();
        const dx = e.clientX - measureDragRef.current.startX;
        const dy = e.clientY - measureDragRef.current.startY;
        setMeasurePos({
            x: measureDragRef.current.origX + dx,
            y: measureDragRef.current.origY + dy
        });
    }

    function handleMeasureDragEnd() {
        measureDragRef.current = null;
    }

    function handlePrintingDragStart(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        const panel = (e.currentTarget as HTMLElement).closest(
            "[data-printing-panel]"
        ) as HTMLElement | null;
        const rect = panel?.getBoundingClientRect();
        if (!rect) return;
        printingDragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: rect.left,
            origY: rect.top
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handlePrintingDragMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!printingDragRef.current) return;
        e.preventDefault();
        const dx = e.clientX - printingDragRef.current.startX;
        const dy = e.clientY - printingDragRef.current.startY;
        setPrintingPos({
            x: printingDragRef.current.origX + dx,
            y: printingDragRef.current.origY + dy
        });
    }

    function handlePrintingDragEnd() {
        printingDragRef.current = null;
    }

    useEffect(() => {
        if (!map) {
            return;
        }

        const handleMapClick = (event: BaseEvent | Event) => {
            if (measurementIsActive) {
                return;
            }

            if (!event || typeof event !== "object" || !("coordinate" in event)) {
                return;
            }

            const mapEvent = event as MapBrowserEvent<PointerEvent>;
            const coordinate = mapEvent.coordinate;

            if (!Array.isArray(coordinate) || coordinate.length < 2) {
                return;
            }

            // Convert the clicked map coordinate (projected) to lat/lon for the
            // weather forecast, while keeping the original for WMS queries.
            const [lon, lat] = transform(
                coordinate as [number, number],
                map.olMap.getView().getProjection(),
                "EPSG:4326"
            );
            if (lon == null || lat == null) {
                return;
            }

            setClickedLocation({
                coordinate: [lat, lon],
                mapCoordinate: coordinate as [number, number]
            });
        };

        map.olMap.on(["singleclick"], handleMapClick);
        return () => {
            map.olMap.un(["singleclick"], handleMapClick);
        };
    }, [map, measurementIsActive]);

    useEffect(() => {
        if (!map || !clickedLocation) {
            return;
        }

        // Draw a marker at the clicked location and remove it when the location
        // changes or the component unmounts.
        const highlight = map.highlights.add([new Point(clickedLocation.mapCoordinate)]);

        return () => {
            highlight.destroy();
        };
    }, [map, clickedLocation]);

    useEffect(() => {
        if (!map || !clickedLocation || !uviVisible) {
            setUviFeatureInfo({ status: "idle" });
            return;
        }

        // Query the UV-Index station WMS layer at the clicked location via
        // GetFeatureInfo and store the result for the info panel.
        const source = uviSourceRef.current;
        const view = map.olMap.getView();
        const resolution = view.getResolution();

        if (!resolution || !source?.getFeatureInfoUrl) {
            setUviFeatureInfo({ status: "error", message: "UVI layer not available." });
            return;
        }

        const url = source.getFeatureInfoUrl(
            clickedLocation.mapCoordinate,
            resolution,
            view.getProjection(),
            { INFO_FORMAT: "application/json", FEATURE_COUNT: "5", BUFFER: "10" }
        );

        if (!url) {
            setUviFeatureInfo({ status: "empty" });
            return;
        }

        const controller = new AbortController();
        setUviFeatureInfo({ status: "loading" });

        // In dev mode, route the DWD request through the local Vite proxy (see vite.config.ts).
        // In production the DWD server allows CORS, so the URL is used directly.
        const proxiedUrl = import.meta.env.DEV
            ? url.replace(/^https:\/\/maps\.dwd\.de\/geoserver\/dwd\/wms/, "/dwd-wms")
            : url;
        fetch(proxiedUrl, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to load station info.");
                const contentType = response.headers.get("content-type") ?? "";
                if (contentType.includes("application/json")) {
                    return response.json().then((data) => ({ kind: "json", data }));
                }
                return response.text().then((data) => ({ kind: "text", data }));
            })
            .then((payload) => {
                if (payload.kind === "json") {
                    const features = Array.isArray(payload.data?.features)
                        ? payload.data.features.map(
                              (feature: { id?: string; properties?: unknown }) => ({
                                  id: feature.id,
                                  properties:
                                      feature.properties && typeof feature.properties === "object"
                                          ? (feature.properties as Record<string, unknown>)
                                          : {}
                              })
                          )
                        : [];
                    setUviFeatureInfo(
                        features.length ? { status: "json", features } : { status: "empty" }
                    );
                    return;
                }
                const text = payload.data?.toString().trim();
                setUviFeatureInfo(text ? { status: "text", content: text } : { status: "empty" });
            })
            .catch((err: unknown) => {
                if (err instanceof Error && err.name === "AbortError") return;
                setUviFeatureInfo({ status: "error", message: "Failed to load station info." });
            });

        return () => {
            controller.abort();
        };
    }, [map, clickedLocation, uviVisible]);

    useEffect(() => {
        if (!map || !clickedLocation || !eucosVisible) {
            setEucosFeatureInfo({ status: "idle" });
            return;
        }

        // The EUCOS ground stations are a client-side WFS vector layer, so instead
        // of a WMS GetFeatureInfo request we query the rendered vector features at
        // the clicked pixel directly from the OpenLayers map.
        const eucosLayer = eucosLayerInstanceRef.current;
        if (!eucosLayer) {
            setEucosFeatureInfo({ status: "error", message: "EUCOS layer not available." });
            return;
        }

        const pixel = map.olMap.getPixelFromCoordinate(clickedLocation.mapCoordinate);
        if (!pixel) {
            setEucosFeatureInfo({ status: "empty" });
            return;
        }

        const features: { id?: string; properties: Record<string, unknown> }[] = [];
        map.olMap.forEachFeatureAtPixel(
            pixel,
            (feature) => {
                const olFeature = feature as {
                    getId?: () => string | number | undefined;
                    getProperties?: () => Record<string, unknown>;
                    getGeometryName?: () => string;
                };
                const allProps = olFeature.getProperties?.() ?? {};
                const geometryName = olFeature.getGeometryName?.() ?? "geometry";
                // Drop the geometry property so only attribute data is displayed.
                const properties = Object.fromEntries(
                    Object.entries(allProps).filter(([key]) => key !== geometryName)
                );
                const rawId = olFeature.getId?.();
                features.push({
                    id: rawId != null ? String(rawId) : undefined,
                    properties
                });
            },
            {
                layerFilter: (layer) => layer === eucosLayer,
                hitTolerance: 5
            }
        );

        setEucosFeatureInfo(features.length ? { status: "json", features } : { status: "empty" });
    }, [map, clickedLocation, eucosVisible]);

    if (!map) {
        return null;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <DefaultMapProvider map={map}>
                <MapContainer data-testid="map-container" aria-label="webgis map">
                    {(tocIsActive || legendIsActive) && (
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                data-testid="map-controls-panel"
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                aria-label="Map controls"
                                w="400px"
                                maxH="calc(100vh - 100px)"
                                display="flex"
                                flexDirection="column"
                            >
                                {tocIsActive && (
                                    <Box data-testid="layer-switcher" flexShrink={0}>
                                        <TitledSection
                                            title={
                                                <SectionHeading size="md">
                                                    Layer Switcher
                                                </SectionHeading>
                                            }
                                        >
                                            <Toc
                                                showTools={true}
                                                basemapSwitcherProps={{
                                                    allowSelectingEmptyBasemap: true
                                                }}
                                            />
                                        </TitledSection>
                                    </Box>
                                )}
                                {tocIsActive && legendIsActive && (
                                    <Box flexShrink={0}>
                                        <Separator my={3} />
                                    </Box>
                                )}
                                {legendIsActive && (
                                    <Box
                                        data-testid="legend"
                                        display="flex"
                                        flexDirection="column"
                                        flex="1"
                                        minH="0"
                                    >
                                        <TitledSection
                                            title={
                                                <SectionHeading size="md">Legend</SectionHeading>
                                            }
                                        >
                                            <Box overflowY="auto" flex="1" minH="0">
                                                <Legend showBaseLayers={false} />
                                            </Box>
                                        </TitledSection>
                                    </Box>
                                )}
                            </Box>
                        </MapAnchor>
                    )}
                    <MapAnchor position="bottom-center" verticalGap={10}>
                        <Flex
                            data-testid="map-toolbar"
                            aria-label="Maptools"
                            direction="row"
                            gap={1}
                            padding={1}
                        >
                            <InitialExtent data-testid="initial-extent-button" />
                            <ZoomIn data-testid="zoom-in-button" />
                            <ZoomOut data-testid="zoom-out-button" />
                            <ToolButton
                                data-testid="measurement-toggle"
                                label="Measurement"
                                icon={<LuRuler />}
                                active={measurementIsActive}
                                onClick={toggleMeasurement}
                            />
                            <ToolButton
                                data-testid="print-toggle"
                                label="Print Map"
                                icon={<LuPrinter />}
                                active={printingIsActive}
                                onClick={togglePrinting}
                            />
                            <ToolButton
                                data-testid="layer-switcher-toggle"
                                label="Layer Switcher"
                                icon={<LuMenu />}
                                active={tocIsActive}
                                onClick={toggleToc}
                            />
                            <ToolButton
                                data-testid="legend-toggle"
                                label="Legend Switcher"
                                icon={<LuImages />}
                                active={legendIsActive}
                                onClick={toggleLegend}
                            />
                            <ToolButton
                                data-testid="info-panel-toggle"
                                label="Info Panel Switcher"
                                icon={<LuInfo />}
                                active={infoPanelIsActive}
                                onClick={toggleInfoPanel}
                            />
                        </Flex>
                    </MapAnchor>
                    {infoPanelIsActive && (
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <Box
                                data-testid="info-panel"
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                aria-label="Map controls"
                                w="400px"
                            >
                                <InfoPanel
                                    coordinate={clickedLocation?.coordinate}
                                    uviFeatureInfo={uviFeatureInfo}
                                    eucosFeatureInfo={eucosFeatureInfo}
                                />
                            </Box>
                        </MapAnchor>
                    )}
                    <MapAnchor position="top-center" verticalGap={10}>
                        <Box
                            data-testid="geocoder-panel"
                            backgroundColor="white"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                            aria-label="Geocoder"
                        >
                            <GeocoderSearch
                                map={map}
                                onSelect={(selection) =>
                                    setClickedLocation({
                                        coordinate: selection.coordinate,
                                        mapCoordinate: selection.mapCoordinate
                                    })
                                }
                            />
                        </Box>
                    </MapAnchor>
                    {printingIsActive && (
                        <div
                            data-printing-panel=""
                            data-testid="printing-panel"
                            style={{
                                position: "fixed",
                                ...(printingPos
                                    ? { left: printingPos.x, top: printingPos.y }
                                    : { right: 420, top: 10 }),
                                zIndex: 1000
                            }}
                        >
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                aria-label="Printing"
                                w="400px"
                                className="printing-hide"
                            >
                                <Box role="dialog" aria-labelledby={printingTitleId}>
                                    <TitledSection
                                        title={
                                            <Box
                                                cursor="grab"
                                                userSelect="none"
                                                onPointerDown={handlePrintingDragStart}
                                                onPointerMove={handlePrintingDragMove}
                                                onPointerUp={handlePrintingDragEnd}
                                            >
                                                <SectionHeading
                                                    id={printingTitleId}
                                                    size="md"
                                                    mb={2}
                                                >
                                                    Print Map
                                                </SectionHeading>
                                            </Box>
                                        }
                                    >
                                        <Printing data-testid="printing" />
                                    </TitledSection>
                                </Box>
                            </Box>
                        </div>
                    )}
                    {measurementIsActive && (
                        <div
                            data-measurement-panel=""
                            data-testid="measurement-panel"
                            style={{
                                position: "fixed",
                                ...(measurePos
                                    ? { left: measurePos.x, top: measurePos.y }
                                    : { left: 420, top: 10 }),
                                zIndex: 1000
                            }}
                        >
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                aria-label="Measurement"
                            >
                                <Box role="dialog" aria-labelledby={measurementTitleId}>
                                    <TitledSection
                                        title={
                                            <Box
                                                cursor="grab"
                                                userSelect="none"
                                                onPointerDown={handleMeasureDragStart}
                                                onPointerMove={handleMeasureDragMove}
                                                onPointerUp={handleMeasureDragEnd}
                                            >
                                                <SectionHeading
                                                    id={measurementTitleId}
                                                    size="md"
                                                    mb={2}
                                                >
                                                    Measurement
                                                </SectionHeading>
                                            </Box>
                                        }
                                    >
                                        <Measurement data-testid="measurement" />
                                    </TitledSection>
                                </Box>
                            </Box>
                        </div>
                    )}
                </MapContainer>
            </DefaultMapProvider>
        </div>
    );
}
