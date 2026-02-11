sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel"
], (Controller, Filter, FilterOperator, ODataModel) => {
    "use strict";

    return Controller.extend("code.cl3.day1111ui501.controller.day1111View01", {
        onInit() {

            var oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL301_SRV/");
            var oModel2 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");

            this.getView().setModel(oModel,"flight");
            this.getView().setModel(oModel2,"AA");
        },
        onPress() {
            var aFilter = [];
            var vAirname = this.getView().byId("ipt1").getValue();

            if (vAirname) {
                aFilter.push(new Filter("Carrname", FilterOperator.Contains, vAirname));
            }

            this.getView().byId("airline").getBinding("rows").filter(aFilter);

        },
        onSearch(){
            var aFilter = [];
            var vCarrid = this.getView().byId("ipt2").getValue();
            var vConnid = this.getView().byId("ipt3").getValue();

            if (vCarrid) {
                aFilter.push(new Filter("Carrid",FilterOperator.Contains, vCarrid));
            }

             if (vConnid) {
                aFilter.push(new Filter("Connid",FilterOperator.EQ, vConnid));
            }

            this.getView().byId("Schedule").getBinding("rows").filter(aFilter);
        },
        onPress2(){
            var aFilter = [];
            var vAirname = this.getView().byId("ipt4").getValue();

            if (vAirname) {
                aFilter.push(new Filter("Carrid", FilterOperator.Contains, vAirname));
            }

            this.getView().byId("Flight").getBinding("rows").filter(aFilter);
        }
    });
});