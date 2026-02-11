sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day10extraclass.controller.Day10ExtraclassView01", {
        onInit() {
            var oData = new JSONModel("/model/spfli.json");
            this.getView().setModel(oData);
        },
        onSearch(oEvent){
            var aFilter = [];
            var vCONTRYFR = this.getView().byId("CONTRYFR").getValue();
            var vCONTRYTO = this.getView().byId("CONTRYTO").getValue();
            var vCond = oEvent.getParameter("query")

            if(vCONTRYFR != ''){
                aFilter.push(new Filter("CONTRYFR",FilterOperator.Contains, vCONTRYFR));
            }

            if(vCONTRYTO != ''){
                aFilter.push(new Filter("CONTRYTO",FilterOperator.Contains, vCONTRYTO));
            }

            if (vCond) {
                aFilter.push(new Filter("CARRID",FilterOperator.Contains, vCond));
            }
            console.log(aFilter);
            this.getView().byId("table").getBinding("rows").filter(aFilter);

        },
        goSecond(){
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteDay10ExtraclassSecondView01");
        }
    });
});