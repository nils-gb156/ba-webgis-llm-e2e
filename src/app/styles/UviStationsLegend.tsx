// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Image, Text } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";

const LEGEND_URL =
    "https://maps.dwd.de/geoserver/dwd/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png" +
    "&LAYER=Uv_Stationen";

export function UviStationsLegend({ layer }: LegendItemComponentProps) {
    return (
        <Box>
            <SectionHeading size="sm" data-testid="toc-heading">
                {layer.title}
            </SectionHeading>
            <Image src={LEGEND_URL} alt={`${layer.title} legend`} mt={2} maxW="200px" />
        </Box>
    );
}
