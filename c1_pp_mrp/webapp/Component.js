sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/Core",
    "sap/ui/core/theming/Parameters",
    "sap/ui/model/json/JSONModel",
    "c1/pp/c1ppmrp/model/models"
], (UIComponent, Core, Parameters, JSONModel, models) => {
    "use strict";

    return UIComponent.extend("c1.pp.c1ppmrp.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            UIComponent.prototype.init.apply(this, arguments);

            this._applyThemeColors();
            Core.attachThemeChanged(this._applyThemeColors, this);

            this.setModel(models.createDeviceModel(), "device");
            this.setModel(new JSONModel({
                selectedRunId: "",
                selectedMaterial: "",
                totalRuns: 0,
                shortageItems: 0,
                criticalItems: 0,
                coveredItems: 0,
                totalResultItems: 0,
                detail: {}
            }), "view");

            this.setModel(new JSONModel({
                materialCoverage: []
            }), "charts");
        },

        // 현재 UI5 테마의 색상을 CSS 변수로 전달한다.
        _applyThemeColors() {
            const oRootStyle = document.documentElement.style;
            const mThemeColors = {
                "--mrp-page-background": "sapBackgroundColor",
                "--mrp-header-background": "sapPageHeader_Background",
                "--mrp-content-background": "sapGroup_ContentBackground",
                "--mrp-border-color": "sapGroup_ContentBorderColor",
                "--mrp-field-background": "sapField_Background",
                "--mrp-field-border-color": "sapField_BorderColor",
                "--mrp-label-color": "sapContent_LabelColor",
                "--mrp-text-color": "sapTextColor",
                "--mrp-positive-color": "sapPositiveColor",
                "--mrp-negative-color": "sapNegativeColor",
                "--mrp-contrast-text-color": "sapContent_ContrastTextColor"
            };

            Object.keys(mThemeColors).forEach((sCssVariable) => {
                const sColor = Parameters.get(mThemeColors[sCssVariable]);
                if (sColor) {
                    oRootStyle.setProperty(sCssVariable, sColor);
                }
            });
        },

        exit() {
            Core.detachThemeChanged(this._applyThemeColors, this);
        }
    });
});
