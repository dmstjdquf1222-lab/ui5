sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller,JSONModel,MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day8extraclass.controller.View001", {
        onInit() {
            var oModel = new JSONModel("/model/Scarr.json");

            // 2. View¿¡ ¸ðµ¨ µî·Ï
            this.getView().setModel(oModel);
        }

    });
});