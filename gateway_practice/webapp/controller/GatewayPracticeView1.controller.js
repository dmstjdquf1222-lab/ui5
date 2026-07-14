sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("gatewaypractice.gatewaypractice.controller.GatewayPracticeView1", {
        onInit() {
        },
        onSearch() {
            var aFilter = [];
            var vBukrs = this.getView().byId("BUKRS").getValue();
            var vGjahr = this.getView().byId("GJAHR").getValue();
            var vBelnr = this.getView().byId("BELNR").getValue();

            if (vBukrs) {
                aFilter.push(new Filter("Bukrs", FilterOperator.EQ, vBukrs));   
            }
            if (vGjahr) {
                aFilter.push(new Filter("Gjahr", FilterOperator.EQ, vGjahr)); // Numeric type은 EQ연산자만 가능. Contains 안됨
            }
            if (vBelnr) {
                aFilter.push(new Filter("Belnr", FilterOperator.EQ, vBelnr));
            }

            this.getView().byId("Table").getBinding("rows").filter(aFilter);
        }
    });
});