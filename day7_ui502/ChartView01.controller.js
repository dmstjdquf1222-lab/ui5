sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day7ui502.controller.ChartView01", {
        onInit() {
            let oModel = new JSONModel("/json/center.json");
            this.getView().setModel(oModel);
        }
    });
});