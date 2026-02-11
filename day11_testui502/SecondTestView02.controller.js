// 사용할 라이브러리의 주소를 지정해준다
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day11testui502.controller.SecondTestView02", {
        onInit() {

            
        },
        // view에서 goSecond라는 이벤트(press) 발생시 아래 함수 실행
        goThird(){
            const oRouter = this.getOwnerComponent().getRouter();
            // 이동할 뷰의 라우터 이름을 입력
			oRouter.navTo("RouteThirdTestView02");
        }
        
    });
});