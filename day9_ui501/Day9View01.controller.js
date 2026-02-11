sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day9ui501.controller.Day9View01", {
        onInit() {

            var oData = {
                chartSet: [
                    { Age: "10", Answer: "25.5" },
                    { Age: "20", Answer: "30.1" },
                    { Age: "30", Answer: "20.0" },
                    { Age: "40", Answer: "10.5" },
                    { Age: "50", Answer: "4.9" },
                    { Age: "60", Answer: "9.0" }
                ]
            }

            let oModel = new JSONModel(oData);

            this.getView().setModel(oModel);

            let oModel2 = new JSONModel("/json/air.json");

            this.getView().setModel(oModel2, "air");


        },
        onSearch(oEvent) {

            // Build search condition
            var aFilter = [];
            // Get search word
            var vCond = oEvent.getParameter("query");
            // Set search condition
            if (vCond) {
                // Put to Array the search condition
                aFilter.push(new Filter("Carrname", FilterOperator.Contains, vCond));
            }
            // Filter binding
            var oTable = this.getView().byId("table");
            var oBinding = oTable.getBinding("rows");
            oBinding.filter(aFilter);
        },
        onWord(){
            
            let aFilter = [];
            // Get search word
            var vId = this.getView().byId("id").getValue();
            var vName = this.getView().byId("name").getValue();


            //Build search condition by case
            if(vId !=''){
                aFilter.push( new Filter("Carrid",FilterOperator.EQ, vId));
            }
            if(vName !=''){
                aFilter.push( new Filter("Carrname", FilterOperator.Contains, vName));
            }
            
            if(aFilter.length >=1){
                this.getView().byId("table").getBinding("rows").filter(aFilter);
            }
        }
    });
});