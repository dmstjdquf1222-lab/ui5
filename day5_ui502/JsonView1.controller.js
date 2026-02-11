sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller,MessageToast,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day5ui502.controller.JsonView1", {
        onInit() {
            const oData = {
                input1 : {
                    val : "Production Plan",
                    desc : "PP 모듈",
                    wid : "200px"
                },
                input2 : {
                    val : "Controlling",
                    desc : "CO 모듈",
                    wid : "200px"
                },
                input3 : {
                    val : "Human Resource",
                    desc : "HR 모듈",
                    wid : "200px"
                },
                
                // inputSet : {
                //     value : "JSON Value",
                //     holder : "JSON Place holder",
                //     width : "300px",
                //     desc : "JSON Descriptoion"
                // },

                // buttonSet : {
                //     text : "JSON Text",
                //     type : "Accept",
                //     icon : "sap-icon://check-availability"
                // },

                // recipient: {
                //     name: "World"
                // }
            }

            let oData2 = {
                header : {
                    text : "UI5 패널",
                    wid : "300px",
                    hei : "400px"
                }
            }

            var oModel = new JSONModel(oData);
            var oMode2 = new JSONModel(oData2);
            this.getView().setModel(oModel);
            this.getView().setModel(oMode2, "panel")
        },
        onShowHello() {
            MessageToast.show("Hello World");
        }
    });
});