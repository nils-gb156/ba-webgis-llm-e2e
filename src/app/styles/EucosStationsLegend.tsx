// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Image } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";

const LEGEND_URL =
    "https://maps.dwd.de/geoserver/dwd/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png" +
    "&LAYER=EUCOS_surface_stations";

export function EucosStationsLegend({ layer }: LegendItemComponentProps) {
    return (
        <Box data-testid="eucos-stations-legend">
            <SectionHeading size="sm">{layer.title}</SectionHeading>
            <Image src={LEGEND_URL} alt={`${layer.title} legend`} mt={2} maxW="200px" />
        </Box>
    );
}
