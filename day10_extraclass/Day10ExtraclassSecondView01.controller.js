sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day10extraclass.controller.Day10ExtraclassSecondView01", {
        onInit() {
            var oData = new JSONModel("/model/spfli.json");
            this.getView().setModel(oData);
        },
        onPress(){
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteDay10ExtraclassView01");
        }
    });
});