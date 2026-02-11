sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/core/Fragment"
], (Controller,Filter,FilterOperator,ODataModel,Fragment) => {
    "use strict";

    return Controller.extend("code.cl3.gwcl3ui501.controller.GWCL3View1", {
        onInit() {
            var oModel = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");

            this.getView().setModel(oModel,"flight");




        },onPress() {
            var aFilter = [];
            var vAirname = this.getView().byId("ipt1").getValue();

            if (vAirname) {
                aFilter.push(new Filter("Carrname", FilterOperator.Contains, vAirname));
            }

            this.getView().byId("airline").getBinding("rows").filter(aFilter);

        },
        onPress1(oEvent){
            this.byId("vizPopover").openBy(oEvent.getSource());

            console.log(this.getView().getModel());
        }
    });
});