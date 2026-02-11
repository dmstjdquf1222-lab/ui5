sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day10ui501.controller.Day10View01", {
        onInit() {

            var oData = {
                kostlSet: [
                    { "kostl": "KS001", "ktext": "Guro center", "kstar": "0098638431" },
                    { "kostl": "KS002", "ktext": "Jongro center", "kstar": "0097638432" },
                    { "kostl": "KS003", "ktext": "Songpa center", "kstar": "0096638433" },
                    { "kostl": "KS004", "ktext": "Gangnam center", "kstar": "0095638434" },
                    { "kostl": "KS005", "ktext": "Seocho center", "kstar": "0093638435" }
                ]
            }

            var oModel = new JSONModel(oData)
            this.getView().setModel(oModel);
        },
        onSearch(oEvent) {

            var aFilter = [];

            var vCond = oEvent.getParameter("query");

            if (vCond) {
                aFilter.push(new Filter("kstar","Contains", vCond));
            }

            this.getView().byId("table").getBinding("rows").filter(aFilter);

        },
        onWord() {

            let aFilter = [];
            // Get search word
            var vKOSTL = this.getView().byId("KOSTL").getValue();
            var vKTEXT = this.getView().byId("KTEXT").getValue();


            //Build search condition by case
            if (vKOSTL != '') {
                aFilter.push(new Filter("kostl", FilterOperator.Contains, vKOSTL));
            }
            if (vKTEXT != '') {
                aFilter.push(new Filter("ktext", FilterOperator.Contains, vKTEXT));
            }

            if (aFilter.length >= 1) {
                this.getView().byId("table").getBinding("rows").filter(aFilter);
            }
        }
    });
});