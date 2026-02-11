sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("coe.cl3.day10ui502.controller.SecondView", {
        onInit() {
        },
        goFirst(){
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteFirstView");
        },
        goThird(){
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteThirdView");
        }
    });
});