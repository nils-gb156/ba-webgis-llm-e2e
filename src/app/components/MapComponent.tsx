// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { LuMenu } from "react-icons/lu";
import { Toc } from "@open-pioneer/toc";

const MAP_ID = "main";

export function MapComponent() {
    const { map } = useMapModel(MAP_ID);
    const [tocIsActive, setTocIsActive] = useState<boolean>(true);

    function toggleToc() {
        setTocIsActive(!tocIsActive);
    }

    if (!map) {
        return null;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <DefaultMapProvider map={map}>
                <MapContainer aria-label="webgis map">
                    <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                        {tocIsActive && (
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
                                <Toc
                                    showTools={true}
                                    basemapSwitcherProps={{ allowSelectingEmptyBasemap: true }}
                                    data-testid="toc-panel"
                                />
                            </Box>
                        )}
                    </MapAnchor>
                    <MapAnchor
                        position="bottom-left"
                        horizontalGap={10}
                        verticalGap={30}
                        data-testid="bottom-left-tools-anchor"
                    >
                        <Flex
                            aria-label="Maptools"
                            direction="column"
                            gap={1}
                            padding={1}
                            data-testid="map-tools"
                        >
                            <ToolButton
                                data-testid="toc-toggle"
                                label="Layer Switcher"
                                icon={<LuMenu />}
                                active={tocIsActive}
                                onClick={toggleToc}
                            />
                            <InitialExtent data-testid="initial-extent-button" />
                            <ZoomIn data-testid="zoom-in-button" />
                            <ZoomOut data-testid="zoom-out-button" />
                        </Flex>
                    </MapAnchor>
                </MapContainer>
            </DefaultMapProvider>
        </div>
    );
}
