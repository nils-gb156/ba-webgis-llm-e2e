// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef, useState, useId } from "react";
import { Box, Flex, Separator } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { LuMenu, LuImages, LuInfo, LuRuler } from "react-icons/lu";
import { Toc } from "@open-pioneer/toc";
import { Legend } from "@open-pioneer/legend";
import { Measurement } from "@open-pioneer/measurement";
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

export function MapComponent() {
    const { map } = useMapModel(MAP_ID);
    const [tocIsActive, setTocIsActive] = useState<boolean>(true);
    const [legendIsActive, setLegendIsActive] = useState<boolean>(true);
    const [infoPanelIsActive, setInfoPanelisActive] = useState<boolean>(true);
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const measurementTitleId = useId();
    const [clickedLocation, setClickedLocation] = useState<
        { coordinate: [number, number]; mapCoordinate: [number, number] } | undefined
    >(undefined);
    const [uviFeatureInfo, setUviFeatureInfo] = useState<UviFeatureInfo>({ status: "idle" });
    const [eucosFeatureInfo, setEucosFeatureInfo] = useState<EucosFeatureInfo>({ status: "idle" });
    const uviSourceRef = useRef<TileWMS | null>(null);
    const eucosSourceRef = useRef<TileWMS | null>(null);

    useEffect(() => {
        if (!map) return;
        uviSourceRef.current =
            (
                findLayerByTitle(map.olMap, UVI_LAYER_TITLE) as
                    | { getSource?: () => TileWMS | undefined }
                    | undefined
            )?.getSource?.() ?? null;
        eucosSourceRef.current =
            (
                findLayerByTitle(map.olMap, EUCOS_LAYER_TITLE) as
                    | { getSource?: () => TileWMS | undefined }
                    | undefined
            )?.getSource?.() ?? null;
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

        const highlight = (
            map as unknown as {
                highlight?: (geometries: Point[]) => { destroy: () => void };
            }
        ).highlight?.([new Point(clickedLocation.mapCoordinate)]);

        return () => {
            highlight?.destroy();
        };
    }, [map, clickedLocation]);

    useEffect(() => {
        if (!map || !clickedLocation) {
            setUviFeatureInfo({ status: "idle" });
            return;
        }

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

        const proxiedUrl = url.replace(/^https:\/\/maps\.dwd\.de\/geoserver\/dwd\/wms/, "/dwd-wms");
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
    }, [map, clickedLocation]);

    useEffect(() => {
        if (!map || !clickedLocation) {
            setEucosFeatureInfo({ status: "idle" });
            return;
        }

        const source = eucosSourceRef.current;
        const view = map.olMap.getView();
        const resolution = view.getResolution();

        if (!resolution || !source?.getFeatureInfoUrl) {
            setEucosFeatureInfo({ status: "error", message: "EUCOS layer not available." });
            return;
        }

        const url = source.getFeatureInfoUrl(
            clickedLocation.mapCoordinate,
            resolution,
            view.getProjection(),
            { INFO_FORMAT: "application/json", FEATURE_COUNT: "5", BUFFER: "10" }
        );

        if (!url) {
            setEucosFeatureInfo({ status: "empty" });
            return;
        }

        const controller = new AbortController();
        setEucosFeatureInfo({ status: "loading" });

        const proxiedUrl = url.replace(/^https:\/\/maps\.dwd\.de\/geoserver\/dwd\/wms/, "/dwd-wms");
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
                    setEucosFeatureInfo(
                        features.length ? { status: "json", features } : { status: "empty" }
                    );
                    return;
                }
                const text = payload.data?.toString().trim();
                setEucosFeatureInfo(text ? { status: "text", content: text } : { status: "empty" });
            })
            .catch((err: unknown) => {
                if (err instanceof Error && err.name === "AbortError") return;
                setEucosFeatureInfo({ status: "error", message: "Failed to load station info." });
            });

        return () => {
            controller.abort();
        };
    }, [map, clickedLocation]);

    if (!map) {
        return null;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <DefaultMapProvider map={map}>
                <MapContainer aria-label="webgis map">
                    {(tocIsActive || legendIsActive) && (
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                aria-label="Map controls"
                                w="400px"
                            >
                                {tocIsActive && (
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
                                )}
                                {tocIsActive && legendIsActive && <Separator my={3} />}
                                {legendIsActive && (
                                    <TitledSection
                                        title={<SectionHeading size="md">Legend</SectionHeading>}
                                    >
                                        <Box maxH="450px" overflowY="auto">
                                            <Legend showBaseLayers={false} />
                                        </Box>
                                    </TitledSection>
                                )}
                            </Box>
                        </MapAnchor>
                    )}
                    <MapAnchor position="bottom-center" verticalGap={10}>
                        <Flex aria-label="Maptools" direction="row" gap={1} padding={1}>
                            <InitialExtent />
                            <ZoomIn />
                            <ZoomOut />
                            <ToolButton
                                label="Layer Switcher"
                                icon={<LuMenu />}
                                active={tocIsActive}
                                onClick={toggleToc}
                            />
                            <ToolButton
                                label="Legend Switcher"
                                icon={<LuImages />}
                                active={legendIsActive}
                                onClick={toggleLegend}
                            />
                            <ToolButton
                                label="Measurement"
                                icon={<LuRuler />}
                                active={measurementIsActive}
                                onClick={toggleMeasurement}
                            />
                            <ToolButton
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
                    <MapAnchor position="bottom-right" horizontalGap={600} verticalGap={10}>
                        {measurementIsActive && (
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
                                            <SectionHeading
                                                id={measurementTitleId}
                                                size="md"
                                                mb={2}
                                            >
                                                Measurement
                                            </SectionHeading>
                                        }
                                    >
                                        <Measurement />
                                    </TitledSection>
                                </Box>
                            </Box>
                        )}
                    </MapAnchor>
                </MapContainer>
            </DefaultMapProvider>
        </div>
    );
}
