sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
], (Controller, Filter, FilterOperator, ODataModel) => {
    "use strict";

    return Controller.extend("cl3.purch.ekkocl3ui501.controller.PuchasingView", {
        onInit() {

            var oModel = new ODataModel("/sap/opu/odata/sap/ZCL3_12_17_DDL_CDS/");

            this.getView().setModel(oModel, "Schedule");

        },
        onSearch() {
            var aFilter = [];
            var vType = this.getView().byId("type").getValue();

            if (vType) {
                aFilter.push(new Filter("bsart", FilterOperator.Contains, vType));
            }

            this.getView().byId("Table").getBinding("rows").filter(aFilter);
        }
    });
});