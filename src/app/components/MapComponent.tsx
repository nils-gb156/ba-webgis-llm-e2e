// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { Box, Flex, Separator } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { LuMenu } from "react-icons/lu";
import { Toc } from "@open-pioneer/toc";
import { Legend } from "@open-pioneer/legend";

const MAP_ID = "main";

export function MapComponent() {
    const { map } = useMapModel(MAP_ID);
    const [tocIsActive, setTocIsActive] = useState<boolean>(true);
    const [legendIsActive, setLegendIsActive] = useState<boolean>(true);

    function toggleToc() {
        setTocIsActive(!tocIsActive);
    }

    function toggleLegend() {
        setLegendIsActive(!legendIsActive);
    }

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
                                data-testid="map-controls-panel"
                            >
                                {tocIsActive && (
                                    <TitledSection
                                        title={
                                            <SectionHeading size="md" data-testid="toc-heading">
                                                Layer Switcher
                                            </SectionHeading>
                                        }
                                    >
                                        <Toc
                                            showTools={true}
                                            basemapSwitcherProps={{
                                                allowSelectingEmptyBasemap: true
                                            }}
                                            data-testid="toc-panel"
                                        />
                                    </TitledSection>
                                )}
                                <Separator my={3} data-testid="toc-legend-separator" />
                                {legendIsActive && (
                                    <TitledSection
                                        title={
                                            <SectionHeading size="md" data-testid="legend-heading">
                                                Legend
                                            </SectionHeading>
                                        }
                                    >
                                        <Box maxH="450px" overflowY="auto">
                                            <Legend showBaseLayers={false} />
                                        </Box>
                                    </TitledSection>
                                )}
                            </Box>
                        </MapAnchor>
                    )}
                    <MapAnchor
                        position="top-right"
                        horizontalGap={10}
                        verticalGap={10}
                        data-testid="maptools-anchor"
                    >
                        <Flex
                            aria-label="Maptools"
                            direction="column"
                            gap={1}
                            padding={1}
                            data-testid="map-tools"
                        >
                            <InitialExtent data-testid="initial-extent-button" />
                            <ZoomIn data-testid="zoom-in-button" />
                            <ZoomOut data-testid="zoom-out-button" />
                            <ToolButton
                                data-testid="toc-toggle"
                                label="Layer Switcher"
                                icon={<LuMenu />}
                                active={tocIsActive}
                                onClick={toggleToc}
                            />
                        </Flex>
                    </MapAnchor>
                </MapContainer>
            </DefaultMapProvider>
        </div>
    );
}
