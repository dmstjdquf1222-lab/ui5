sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code1.cl312.airlinesplit12.controller.SplitView", {
        onInit() {
        },
        onSpfli: function (oEvent) {
            var oData = oEvent.getSource().getBindingContext().getObject();
            let oBinding = this.getView().byId("spfli").getBinding("rows");
            let aFilter = [];

            aFilter.push(new Filter("Carrid", FilterOperator.EQ, oData.Carrid));
            oBinding.filter(aFilter);
        },
        onSflight: function (oEvent) {
            var oData = oEvent.getParameter("rowBindingContext").getObject();
            let oBinding = this.getView().byId("sflight").getBinding("rows");
            let aFilter = [];

            aFilter.push(new Filter("Carrid", FilterOperator.EQ, oData.Carrid));
            aFilter.push(new Filter("Connid", FilterOperator.EQ, oData.Connid));

            oBinding.filter(aFilter);
        }
    });
});