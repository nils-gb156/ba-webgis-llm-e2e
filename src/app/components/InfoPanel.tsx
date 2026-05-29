// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Separator } from "@chakra-ui/react";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { WeatherForecast } from "./WeatherForecast";
import { UviStationInfo, type UviFeatureInfo } from "./UviStationInfo";

export interface InfoPanelProps {
    coordinate?: [number, number];
    uviFeatureInfo?: UviFeatureInfo;
}

export function InfoPanel({ coordinate, uviFeatureInfo }: InfoPanelProps) {
    const showUviInfo = uviFeatureInfo?.status === "json" || uviFeatureInfo?.status === "text";

    return (
        <TitledSection
            title={
                <SectionHeading size="md" data-testid="toc-heading">
                    Information
                </SectionHeading>
            }
        >
            <SectionHeading size="sm" data-testid="toc-heading">
                Weather Forecast
            </SectionHeading>
            <Box mt={2} data-testid="info-panel-content">
                {coordinate ? (
                    <WeatherForecast coordinate={coordinate} />
                ) : (
                    <p data-testid="info-panel-empty">Click on the map to load a forecast.</p>
                )}
            </Box>

            {showUviInfo && (
                <>
                    <Separator my={3} />
                    <SectionHeading size="sm" mt={4} data-testid="uvi-info-heading">
                        UVI Station
                    </SectionHeading>
                    <Box mt={2} data-testid="uvi-info-content">
                        <UviStationInfo uviFeatureInfo={uviFeatureInfo} />
                    </Box>
                </>
            )}
        </TitledSection>
    );
}
