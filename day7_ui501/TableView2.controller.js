sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day7ui501.controller.TableView2", {
        onInit() {
            let oModel = new JSONModel("/json/gsber.json");
            this.getView().setModel(oModel);

        }
    });
});