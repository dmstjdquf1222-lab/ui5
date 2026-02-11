sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller,History) => {
    "use strict";

    return Controller.extend("code.cl3.paramroute01.controller.RecView", {
        onInit() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteRecView").attachPatternMatched(this.onMatchRoute,this);
        },
        onMatchRoute(oEvent){
            // Get parameter value
            var vCarrid = oEvent.getParameter("arguments").Carrid;
            var vConnid = oEvent.getParameter("arguments").Connid;

            this.byId("rCarrid").setValue(vCarrid);
            this.byId("rConnid").setValue(vConnid);
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