sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
    "sap/m/MenuItem",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library" ,
    "sap/ui/model/json/JSONModel"
], (Controller, ODataModel,MessageToast, Filter, FilterOperator, Sorter, MenuItem, Spreadsheet, exportLibrary,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.project1.controller.TC1View", {
       onInit() {
            
            var oModel2 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");

            this.getView().setModel(oModel2,"Model2");

            this.bDescending = false;

            // 1. 로컬 JSON 모델 생성
            var oJsonModel = new JSONModel({ AirlineSet: [] });
            this.getView().setModel(oJsonModel, "localFlight");

            // 2. ODataModel 생성
            var oOData = new ODataModel("/sap/opu/odata/sap/ZCODE_CL301_SRV/");

            // 3. OData 읽어서 JSONModel에 세팅
            oOData.read("/AirlineSet", {
                success: function(oData) {
                    oJsonModel.setProperty("/AirlineSet", oData.results);
                },
                error: function(oError) {
                    console.error("OData 읽기 실패", oError);
                }
            });




        },
        // onFinally() {
        //     var oRouter = this.getOwnerComponent().getRouter();
        //     oRouter.navTo("RoutefourthView");
        // },
        onBack() {
            // const oHistory = History.getInstance();
            // const sPreviousHash = oHistory.getPreviousHash();

            // if (sPreviousHash !== undefined) {
            //     window.history.go(-1);
            // } else console.log(sPreviousHash);
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutesecondView");

        },
         onFlightSet(){
             var oRouter = this.getOwnerComponent().getRouter();
             oRouter.navTo("RoutefourthView");
         },
         onPaymentSet(){
            var oRouter = this.getOwnerComponent().getRouter();
             oRouter.navTo("RoutefifthView");
         }, onSearch(oEvent){

            var aFilter = [];
            
            var vCond = oEvent.getParameter("query");

            if (vCond) {
                aFilter.push( new Filter("Carrname", FilterOperator.Contains, vCond) );             
            }

            var oTable = this.getView().byId("table1");
            var oBind = oTable.getBinding("rows");
            oBind.filter(aFilter);        

        },

        onMenuAction(oEvent) {
            var sItemText = oEvent.getParameter("item").getText();

            switch(sItemText) {
                case "Export as PDF":
                    this._exportPDF();
                    break;
                case "Export to Excel":
                    this._exportExcel();
                    break;
                default:
                    MessageToast.show("Unknown menu item: " + sItemText);
            }
        },

        // PDF Export 처리 (간단한 메시지 예제)
        _exportPDF: function() {
            // 실제 PDF export는 PDF 라이브러리 필요
            // 여기서는 예제용 MessageToast
            MessageToast.show("Export as PDF 기능 실행!");
            // 나중에 PDF 라이브러리 연결 가능
        },

        // Excel Export 처리
        _exportExcel() {
            var oTable = this.byId("table1"); // 테이블 ID

            // var oModel = oTable.getModel("localFlight");

            // 1️⃣ 테이블에 표시된 (필터/정렬 반영된) Context 가져오기
            var oBinding = oTable.getBinding("rows");
            var aContexts = oBinding.getContexts(0, oBinding.getLength());

            // 2️⃣ Context에서 실제 데이터 오브젝트 추출 (for문 사용)
            var aVisibleData = [];
            for (var i = 0; i < aContexts.length; i++) {
                var oContext = aContexts[i];
                var oData = oContext.getObject();  // 각 행의 실제 데이터
                aVisibleData.push(oData);
            }

            var aCols = [
                { label: "Airline", property: "Carrid" },
                { label: "Airline name", property: "Carrname" },
                { label: "Currency", property: "Currcode" },
                { label: "Home page", property: "Url" }
            ];

            var oSettings = {
                workbook: { columns: aCols },
                dataSource: aVisibleData,
                fileName: "Airline_List.xlsx"
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build()
                .then(function() {
                    MessageToast.show("Excel export 완료!");
                })
                .catch(function(err) {
                    MessageToast.show("Excel export 실패: " + err);
                });
        },

        goSecond(){

			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RoutefourthView");            
        },
        


    });
});