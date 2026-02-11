sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day8ui501.controller.Day8_View01", {
        onInit() {
            var oModel = new JSONModel("/JSON/Base.json");
            this.getView().setModel(oModel);

            var oModel2 = new JSONModel("/JSON/Old.json");
            this.getView().setModel(oModel2,"Old");

            var oModel3 = new JSONModel("/JSON/Profit.json");
            this.getView().setModel(oModel3,"Pro");

        }
    });
});