sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller,MessageToast,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day6ui501.controller.JSONView3", {
        onInit() {

            //tablb 실습

            let oData = {
                airlineSet : [
                    {Aircd : "AA", Airline : "American airline", URL : "http//www.aa.com", Curr : "USD"},
                    {Aircd : "KA", Airline : "Korean airline", URL : "http//www.koreanair.com", Curr : "KRW"},
                    {Aircd : "LH", Airline : "Luft hanza", URL : "http//www.lufthanza.com", Curr : "EUR"}
                ]
            }

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel,"air");

            /*

            // json model 실습

            let oData = {
                labelSet : {
                    text : "JSON Label",
                    width : "100px",
                    vAlign : "Bottom"
                },
                inputSet : {
                    value : "JSON Article title",
                    holder : "JSON Place holder",
                    width : "270px",
                    desc : "JSON Description"
                },
                buttonSet : {
                    text : "Confirm",
                    type : "Accept",
                    press : "onClick()",
                    icon : "sap-icon://check-availability"
                }
            }

            let oData2 = {
                panelSet : {
                    header : "UI5 JSON Header",
                    width : "700px",
                    height : "400px"
                }
            }

            // Import JSON Model from file
            var oModel = new JSONModel("/data/ui5.json");

            // Set JSON model
            this.getView().setModel(oModel,"file");


            var vModel = new JSONModel(oData);
            var vModel2 = new JSONModel(oData2);
            this.getView().setModel(vModel);
            this.getView().setModel(vModel2,"panel");

            */

        },

        onArray(){

            let lt_data = [
                { Id : "Alpha", Pw : "12345" },
                { Id : "Bravo", Pw : "abcde" },
                { Id : "Charlie", Pw : "qwert" }
            ];

            for(let value of lt_data){
                console.log("value = ", value)
                for(let property in value){
                    console.log("property : ", property, "value[",property,"] = ",value[property])
                }
            }

        }
    }); 
});