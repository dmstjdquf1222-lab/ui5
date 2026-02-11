sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day2ui501.controller.Day2View01", {
        onInit() {
        },
        onPress() {
            let vScore1 = this.getView().byId("score1").getValue();
            let vScore2 = this.getView().byId("score2").getValue();
            MessageToast.show(parseInt(vScore1) + parseInt(vScore2));

        }
    });
});