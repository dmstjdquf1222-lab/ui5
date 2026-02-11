var aData = ["ALPHA", "BRAVO", "CHARLE", "DELTA"];
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day5ui501.controller.Day5View01", {
        onInit() {
        },
        onCreate() {
            this.getView().byId("btn_create").setIcon("sap-icon://accept");
            this.getView().byId("btn_search").setIcon("");
            this.getView().byId("btn_delete").setIcon("");

            var vData = this.getView().byId("Data").getValue();

            aData.push(vData);
            this.getView().byId("Result").setValue(aData);
        },
        onDelete() {
            this.getView().byId("btn_create").setIcon("");
            this.getView().byId("btn_search").setIcon("");
            this.getView().byId("btn_delete").setIcon("sap-icon://accept");

            var vData = this.getView().byId("Data").getValue();

            for (let i in aData) {
                if (vData == aData[i]) {
                    aData.splice(i, 1);
                    break;
                }
            }
            this.getView().byId("Result").setValue(aData);

            /*var vaData = aData.indexOf(vData);
            if (vaData !== -1) {
                aData.splice(vaData, 1);
            }
            this.getView().byId("Result").setValue(aData);*/
        },
        onSearch() {
            this.getView().byId("btn_create").setIcon("");
            this.getView().byId("btn_search").setIcon("sap-icon://accept");
            this.getView().byId("btn_delete").setIcon("");

            var vData = this.getView().byId("Data").getValue();
            var val;

            for (let i of aData) {
                if (vData == i) {
                    val = i;
                    break;
                }
            }

            if (val == vData) {
                this.getView().byId("Result").setValue(val);
            }
            else {
                this.getView().byId("btn_search").setIcon("sap-icon://alert");
                MessageToast.show("Data not found");
            }



        }
    });
});