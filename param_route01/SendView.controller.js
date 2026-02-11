sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller,History) => {
    "use strict";

    return Controller.extend("code.cl3.paramroute01.controller.SendView", {
        onInit() {
        },
        onSend() {
            // Get input value
            var vCarrid = this.byId("Carrid").getValue();
            var vConnid = this.byId("Connid").getValue();

            //Navi to receive with parameter
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteRecView", { Carrid: vCarrid, Connid: vConnid })
        },
        onBack() {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteMainView", {}, true);
            }
        }
    });
});