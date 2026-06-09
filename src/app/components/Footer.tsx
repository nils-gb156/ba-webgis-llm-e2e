// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@chakra-ui/react";
import { useMapModel } from "@open-pioneer/map";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";

const MAP_ID = "main";

export function Footer() {
    const { map } = useMapModel(MAP_ID);

    if (!map) {
        return null;
    }

    return (
        <Box
            role="region"
            aria-label="Footer Bar"
            textAlign="center"
            py={2}
            px={4}
            backgroundColor="white"
            borderTopWidth="1px"
            minHeight="auto"
        >
            <Flex role="region" gap={3} alignItems="center" justifyContent="center">
                <CoordinateViewer
                    map={map}
                    displayProjectionCode="EPSG:4326"
                    format="degree"
                    precision={2}
                />
                <ScaleBar map={map} />
                <ScaleViewer map={map} />
            </Flex>
        </Box>
    );
}
