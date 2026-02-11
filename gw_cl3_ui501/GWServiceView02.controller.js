sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.gwcl3ui501.controller.GWServiceView02", {
        onInit() {
        },
        onPress(){
            var aFilter = [];
            var vCarrid = this.getView().byId("ipt1").getValue();
            var vConnid = this.getView().byId("ipt2").getValue();

            if (vCarrid) {
                aFilter.push(new Filter("Carrid",FilterOperator.Contains, vCarrid));
            }

             if (vConnid) {
                aFilter.push(new Filter("Connid",FilterOperator.EQ, vConnid));
            }

            this.getView().byId("airline").getBinding("rows").filter(aFilter);

        }
    });
});