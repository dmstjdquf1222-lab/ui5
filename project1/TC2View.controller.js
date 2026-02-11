sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MenuItem",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
], (Controller, ODataModel, MessageToast, Filter, FilterOperator, Sorter, MenuItem, Spreadsheet, exportLibrary) => {
    "use strict";

    return Controller.extend("code.cl3.project1.controller.TC2View", {
        onInit() {

            var oModel2 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");

            this.getView().setModel(oModel2, "Model2");


        },
        onPress() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutefifthView");
        },
        onAirlineSet() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutethirdView");
        },
        onPaymentSet() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutefifthView");
        }, onBack() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutesecondView");
        },
        onInput() {

            let aFilter = [];

            var vId = this.getView().byId("Air1").getValue();
            var vCode = this.getView().byId("Fr1").getValue();

            if (vId != '') {
                aFilter.push(new Filter("Carrid", FilterOperator.EQ, vId));
            }
            if (vCode != '') {
                aFilter.push(new Filter("Connid", FilterOperator.EQ, vCode));
            }

            if (aFilter.length > 0) {

                this.getView().byId("table2").getBinding("rows").filter(aFilter);
            }
        },


        goThird() {

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RoutefifthView");

        },
        onMenuAction(oEvent) {
            var sItemText = oEvent.getParameter("item").getText();

            switch (sItemText) {
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
        _exportPDF: function () {
            // 실제 PDF export는 PDF 라이브러리 필요
            // 여기서는 예제용 MessageToast
            MessageToast.show("Export as PDF 기능 실행!");
            // 나중에 PDF 라이브러리 연결 가능
        },

        // Excel Export 처리
        _exportExcel() {
            var oTable = this.byId("table2"); // 테이블 ID

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
                { label: "Airline Code", property: "Carrid" },
                { label: "Freight code", property: "Connid" },
                { label: "Freight Date", property: "Fldate" },
                { label: "Price", property: "Price" },
                { label: "Currency", property: "Currency" },
                { label: "Aircraft Type", property: "Planetype" }
            ];

            var oSettings = {
                workbook: { columns: aCols },
                dataSource: aVisibleData,
                fileName: "Frieght Schedules_List.xlsx"
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build()
                .then(function () {
                    MessageToast.show("Excel export 완료!");
                })
                .catch(function (err) {
                    MessageToast.show("Excel export 실패: " + err);
                });
        },




    });
});