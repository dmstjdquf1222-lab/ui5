sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.paramroute01.controller.MainView", {
        onInit() {
        },
        onBegin(){
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteSendView");
        }
    });
});