sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day2ui502.controller.Day2View02", {
        onInit() {

            // ※ 객체를 포함하고 있는 배열
            // 1)
            var gt_kostl = [
                {
                    Kostl: "KS1770",
                    Ktext: "Chemical manage"
                },
                {
                    Kostl: "KS1880",
                    Ktext: "Natural manage"
                }
            ];


            // 2)
            var gt_prctr = [
                {
                    Prctr: "PR001",
                    Gtext: "Jongro center"
                },
                {
                    Prctr: "PR002",
                    Gtext: "Songpa center"
                }
            ];

            // 3) 
            var gt_data = ["Apple", "Banana", "Carrot"];

            var gs_object = {
                City: "Seoul",
                Zone: "Jongro",
                Post: "777"
            };


            for (let i of gt_prctr) {
                console.log(i);
            }

            // ※ 위에 선언된 배열 및 객체를 FOR의 IN, OF를 이용하여 추출한 데이터를
            //    console.log로 출력한다.
        },
        onCalcul() {
            let vH1 = this.getView().byId("h1").getValue();
            let vV1 = this.getView().byId("v1").getValue();
            this.getView().byId("a1").setValue(parseInt(vH1) * parseInt(vV1));
        },
        onClick() {
            for (let i = 1; i < 10; i += 2) {
                for (let j = 1; j < 10; j++) {
                    console.log(i + "*" + j + "=" + i * j);
                }
            }
        }
    });
});
