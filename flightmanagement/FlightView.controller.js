let loginData = [
                {
                    id : "root", pw : "123"
                },
                {
                    id : "admin", pw : "456"
                },
                {
                    id : "test", pw : "test"
                }
            ];

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.flightmanagement.controller.FlightView", {
        onInit() {
        },
        onLogin(){
            let id = this.getView().byId("idInput").getValue();
            let pw = this.getView().byId("pwInput").getValue();

            let idFlag;
            let pwFlag;

            for(let i of loginData){
                if(id != i.id){
                    idFlag = 0;
                } else if(pw != i.pw){
                    pwFlag = 0;
                } else{
                    idFlag = 1;
                    pwFlag = 1;
                    break;
                }
                // if(id == i.id){
                //     idFlag = 1;
                //     break;
                // } else {
                //     idFlag = 0;
                // }
            }

            // for(let i of loginData){
            //     if(pw == i.pw){
            //         pwFlag = 1;
            //         break;
            //     } else {
            //         pwFlag = 0;
            //     }
            // }

            if(idFlag == 1 && pwFlag == 1){
                
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RoutesecondView");
                MessageToast.show("로그인 성공");
                
            } else {
                MessageToast.show("로그인 정보가 맞지 않습니다");
            }
            // else if(idFlag == 0){
            //     MessageToast.show("ID를 다시 입력해주세요");
            //     console.log("로그인 실패");
            // } else {
            //     MessageToast.show("PW를 다시 입력해주세요");
            // }
        }
    });
});