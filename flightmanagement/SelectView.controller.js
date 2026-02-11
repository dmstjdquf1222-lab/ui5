sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel"

], (Controller,JSONModel,ODataModel) => {
    "use strict";

    return Controller.extend("code.cl3.flightmanagement.controller.SelectView", {
         onInit() {

            // 251112 한지희 - 데이터셋 조회 page
            // JSON 모델 데이터 예시
            // 정상!!!!!!!!!!!!!!!!!!!!!!!!
            var oData = {
                "Services": [
                    { "Key": "ZCODE_CL301_SRV", 
                      "Text": "Airline master", 
                      "Entities": [
                                    { "Key": "AirlineSet", "Text": "AirlineSet" }
                                ]
                    },
                    { "Key": "ZGWCODE_CL302_SRV", 
                      "Text": "Flight master", 
                      "Entities": [
                                    { "Key": "FlightSet", "Text": "FlightSet" },
                                    { "Key": "PaymentSet", "Text": "PaymentSet" }
                                ]
                    }
                ]
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "cb");

            // 서비스 불러오기
            var oModel3 = new ODataModel("/sap/opu/odata/sap/ZGWCODE_CL302_SRV/");
            this.getView().setModel(oModel3, "flight");


        },


        onTC() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RoutethirdView");
		},// 첫 번째 콤보박스
        onServiceChange(oEvent) {   
            // 파라미터 통해 선택한 값(SelectedKey)
            var sSelectedServiceKey = oEvent.getSource().getSelectedKey();
            var oModel = this.getView().getModel("cb");

            // 두번째 콤보박스 갱신
            var aServices = oModel.getProperty("/Services");
            var aSelectedCities = [];
            for (var i = 0; i < aServices.length; i++) {
                if (aServices[i].Key === sSelectedServiceKey) {
                    aSelectedCities = aServices[i].Entities;
                    break;
                }
            }
        
            var oCitiesModel = new JSONModel({ "Entities" : aSelectedCities });
            var oEntitiesComboBox = this.getView().byId("entitiesComboBox");
            oEntitiesComboBox.setModel(oCitiesModel);
            oEntitiesComboBox.bindItems({
                path: "/Entities",
                template: new sap.ui.core.Item({
                    key: "{Key}",
                    text: "{Text}"
                })
            });

                // 두 번째 콤보 선택 초기화
                oEntitiesComboBox.setSelectedKey(null);

        },
        // 251113 한지희 차트 모델 바인딩 동적 변경
        onEntityChange(oEvent) {

            

            var sSelectedEttKey = oEvent.getSource().getSelectedKey(); // 두 번째 콤보에서 선택한 key
            var oChart1 = this.byId("iLine");
            // var oChart2 = this.byId("iLine2");
            var oTable1 = this.byId("idTable1");
            var oTable2 = this.byId("idTable2");
            var oTable3 = this.byId("idTable3");

            // 기존 차트 초기화
            oChart1.unbindPoints();
            oChart1.setModel(null);
            oChart1.setVisible(false);
            oTable1.unbindItems();
            oTable1.setModel(null);
            oTable1.setVisible(false);
            oTable2.unbindItems();
            oTable2.setModel(null);
            oTable2.setVisible(false);
            oTable3.unbindItems();
            oTable3.setModel(null);
            oTable3.setVisible(false);

            if (sSelectedEttKey === "AirlineSet") {
                var oAirModel = this.getView().getModel();
                oChart1.setModel(oAirModel);
                oChart1.bindPoints({
                    path: "/AirlineSet",
                    template: new sap.suite.ui.microchart.InteractiveLineChartPoint({
                        value: "{=parseFloat(${Price})}",
                        label: "{Carrid}"
                    })
                });
                // 테이블 바인딩
                oTable1.setModel(oAirModel);
                oTable1.bindItems({
                    path: "/AirlineSet",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.ObjectIdentifier({ title: "{Carrid}" }), // Airline Code
                            new sap.m.Text({ text: "{Currcode}" })              // Currency
                        ]
                    })
                });
                oTable1.setVisible(true);

            } else if (sSelectedEttKey === "FlightSet") {
                var oFlightModel = this.getView().getModel("flight");
        oChart1.setModel(oFlightModel);
        oChart1.bindPoints({
            path: "/FlightSet",
            template: new sap.suite.ui.microchart.InteractiveLineChartPoint({
                value: "{=parseFloat(${Price})}",
                label: "{Carrid}"
            })
        });
        oChart1.setVisible(true);

        // FlightSet 데이터를 읽어서 처음 8행만 보여주기
        oFlightModel.read("/FlightSet", {
            success: function(oData) {
                var aSlice = oData.results.slice(0, 8); // 처음 8개
                var oSliceModel = new sap.ui.model.json.JSONModel();
                oSliceModel.setData({ FlightSet: aSlice });

                oTable2.setModel(oSliceModel);
                oTable2.bindItems({
                    path: "/FlightSet",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.ObjectIdentifier({ title: "{Carrid}" }),
                            new sap.m.Text({ text: "{Fldate}" })
                        ]
                    })
                });
                oTable2.setVisible(true);
            },
            error: function(err) {
                sap.m.MessageToast.show("FlightSet 데이터를 불러오는 데 실패했습니다.");
            }
        });
            } else if (sSelectedEttKey === "PaymentSet") {
                var oFlightModel = this.getView().getModel("flight");
                oChart1.setModel(oFlightModel);
                oChart1.bindPoints({
                    path: "/PaymentSet",
                    template: new sap.suite.ui.microchart.InteractiveLineChartPoint({
                        value: "{=parseFloat(${Price})}",
                        label: "{Carrid}"
                    })
                });
                oChart1.setVisible(true);
                // 테이블 바인딩
                oTable3.setModel(oFlightModel);
                oTable3.bindItems({
                    path: "/PaymentSet",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.ObjectIdentifier({ title: "{Carrid}" }), // Airline Code
                            new sap.m.Text({ text: "{Price}" })              // Price
                        ]
                    })
                });
                oTable3.setVisible(true);
            }
            },

        // 251113 문은성 비즈팝업
        onPress1(oEvent){
            // 콤보 선택 여부 확인 : 한지희 수정
            var sServiceKey = this.byId("servicesComboBox").getSelectedKey();
            if (!sServiceKey) {
                sap.m.MessageToast.show("먼저 서비스를 선택해주세요.");
                return;
            }
            var sSelectedKey = this.byId("entitiesComboBox").getSelectedKey();
            if (!sSelectedKey) {
                sap.m.MessageToast.show("엔티티셋을 선택해주세요.");
                return;
            }
            this.byId("vizPopover").openBy(oEvent.getSource());
        },
        // 251113 한지희 화면 전환(to 데이터 조회화면)
        onSend() {
            // 콤보 선택 여부 확인
            var sServiceKey = this.byId("servicesComboBox").getSelectedKey();
            if (!sServiceKey) {
                sap.m.MessageToast.show("먼저 서비스를 선택해주세요.");
                return;
            }
            var sSelectedKey = this.byId("entitiesComboBox").getSelectedKey();
            if (!sSelectedKey) {
                sap.m.MessageToast.show("엔티티셋을 선택해주세요.");
                return;
            }

            var oRouter = this.getOwnerComponent().getRouter();

            // 선택값에 따라 다른 뷰로 라우트
            switch(sSelectedKey) {
                case "AirlineSet":
                    oRouter.navTo("RoutethirdView");
                    sap.m.MessageToast.show("RoutethirdView");
                    break;
                case "FlightSet":
                    oRouter.navTo("RoutefourthView");
                    sap.m.MessageToast.show("RoutefourthView");
                    break;
                case "PaymentSet":
                    oRouter.navTo("RoutefifthView");
                    sap.m.MessageToast.show("RoutefifthView");
                    break;
                default:
                    sap.m.MessageToast.show("유효하지 않은 선택입니다.");
            }
        }
    });
});