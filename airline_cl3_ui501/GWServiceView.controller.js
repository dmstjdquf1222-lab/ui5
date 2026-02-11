sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.airlinecl3ui501.controller.GWServiceView", {
        onInit() {
        },
        onPress(){
            var aFilter = [];
            var vAirname = this.getView().byId("ipt1").getValue();

            if (vAirname) {
                aFilter.push(new Filter("Carrname",FilterOperator.Contains, vAirname));
            }

            this.getView().byId("airline").getBinding("rows").filter(aFilter);

        }
    });
});