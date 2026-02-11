sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"

], (Controller, ODataModel, MessageToast, Filter, FilterOperator, JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.project1.controller.TC3View", {
         onInit() {
             var oModel2 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oModel2,"Model2");

            var oChartModel = new JSONModel({ rows: [] });
            this.getView().setModel(oChartModel, "chart");

        },
        onAirlineSet() {
             var oRouter = this.getOwnerComponent().getRouter();
             oRouter.navTo("RoutethirdView");
         },
         onFlightSet(){
             var oRouter = this.getOwnerComponent().getRouter();
             oRouter.navTo("RoutefourthView");
         },onBack() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutesecondView");
        },

        onInput2(){

            let aFilter = [];

            var vId = this.getView().byId("Air2").getValue();

            if (vId != '') {
                aFilter.push(new Filter("Carrid", FilterOperator.EQ, vId));               
            }
            
            if (aFilter.length > 0 ) {

                this.getView().byId("payTable").getBinding("rows").filter(aFilter);
            }

        },
        
        goFirst(){

			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteThirdView"); 

        },

         onPayTableSelectionChange(oEvent){
            var oTable = oEvent.getSource();
            // var aSelectedData = oTable.getSelectedIndices()
            //     .map(i => oTable.getContextByIndex(i).getObject()); // 선택된 행 객체 바로 가져오기

            var aSelectedIndices = oTable.getSelectedIndices(); // 선택된 행 인덱스 배열
            var aSelectedData = []; // 결과를 담을 배열

            for (var i = 0; i < aSelectedIndices.length; i++) {
                var index = aSelectedIndices[i];                  // 선택된 행 번호
                var oContext = oTable.getContextByIndex(index);   // 해당 인덱스의 바인딩 컨텍스트
                var oData = oContext.getObject();                 // 데이터 객체 가져오기
                aSelectedData.push(oData);                        // 결과 배열에 추가
            }

            this.getView().getModel("chart").setProperty("/rows", aSelectedData);

            var oVizFrame = this.getView().byId("idVizFrame");
            var oPopOver = this.getView().byId("idPopOver");
            oPopOver.connect(oVizFrame.getVizUid());
            oVizFrame.getDataset().setContext("Airline");

            var oVizFrame2 = this.getView().byId("idVizFrame2");
            var oPopOver2 = this.getView().byId("idPopOver2");
            oPopOver2.connect(oVizFrame2.getVizUid());
        }



    });
});