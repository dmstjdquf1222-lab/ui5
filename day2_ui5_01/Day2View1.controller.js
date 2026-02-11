sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day2ui501.controller.Day2View1", {
        onInit() {

            let vSum = 0;
            // For Loop : Case 1
            for (let i = 1; i <= 3; i++) {
                console.log("i = " + i);
                for (let j = 1; j <= 5; j++) {
                    console.log("J = " + j);
                };
                console.log("-------------------");
            };

            console.log("************************************");
            
            // For Loop : Case 2
            var gs_object = {
                Major: "SAP",
                Class: "CL3",
                Zone: "Guro"
            };

            for (let prop in gs_object) {
                console.log("Properties : " + prop);
                console.log("gs_object[" + prop + "] = " + gs_object[prop])
            };

            console.log("************************************");

            // For Loop : Case 3
            var vArray = [
                "A", "B", "C"
            ];

            for (let value of vArray) {
                console.log("Value = " + value);
            };

            for (let prop in vArray) {
                console.log("prop = " + prop);
                console.log("vArray["+prop+"] = " +vArray[prop]);
            };

            console.log("************************************");

            var aData = [
                { City : "Seoul", Class : "CL3" },
                { City : "Seoul", Class : "CL5" },
                { City : "Busan", Class : "CL7" }
            ];

            for(let i of aData){

                // 2중 for문 사용하여 배열(aData) 안의 객체(City, Class)까지 출력
                
                /*for(let j in i){
                    console.log(j+":"+i[j]);
                }*/
                console.log("i = ",i);
                console.log("i.City = "+i.City);
            };

        },
        onPress() {

            let vNum1, vNum2, vRsult;

            vNum1 = this.getView().byId("num1").getValue();
            vNum2 = this.getView().byId("num2").getValue();


            vRsult = parseInt(vNum1) + parseInt(vNum2);

            MessageToast.show("result = " + vRsult);

        }

    });
});