var vGlobal;  // 전역변수

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day3.ui501.controller.Day3View01", {
        onInit() {

            /*

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

            for (let i in gs_object) {
                console.log(i);
            };

            console.log(gs_object.City);


            for (let i of gt_prctr) {
                for (let j in i) {
                    console.log(j + ":" + i[j]);
                };
            };

            */

            // ※ 위에 선언된 배열 및 객체를 FOR의 IN, OF를 이용하여 추출한 데이터를
            //    console.log로 출력한다.


            // var i = 2, j = 1;  // 지역변수

            // // Multipli table with WHILE Loop

            // while (i < 10) {
            //     console.log("<", i, "> 단");
            //     j = 1;
            //     while (j < 10) {
            //         console.log(i + "x" + j + "=" + i * j);
            //         j++;
            //     }
            //     i++;
            //     console.log("------------------------");
            // }



        },
        //while문
        onPress() {

            let Vnum1 = this.getView().byId("num1").getValue();


            // 논리연산자 or(||)
            var i = 0;

            if (Vnum1 < 2 || Vnum1 > 9) {
                MessageToast.show("Invalid number");
            }
            else {

                while (i < 9) {
                    i++;
                    console.log(Vnum1 + "x" + i + "=" + Vnum1 * i);
                }
                console.log("------------------------");
            }

            // 논리연산자 and(&&)
            //var i = 1;

            // if (1 < Vnum1 && Vnum1 < 10) {

            //     while (i < 10) {
            //         console.log(Vnum1 + "x" + i + "=" + Vnum1 * i);
            //         i++;
            //     }
            //     console.log("------------------------");

            // }
            // else {
            //     MessageToast.show("Invalid number");
            // }

        },
        //do while문
        onClick() {
            let vNum2 = this.getView().byId("num2").getValue();

            var i = 1;

            if (1 < vNum2 && vNum2 < 10) {
                do {
                    console.log(vNum2 + "x" + i + "=" + vNum2 * i);
                    i++;
                } while (i < 10);

            } else {
                MessageToast.show("Invalid number");
            }
        },
        onChange() {

            var vIcon = this.getView().byId("btn1").getIcon();

            if (vIcon) {
                this.getView().byId("btn1").setIcon();
                this.getView().byId("btn1").setText("Button");
            }
            else {
                this.getView().byId("btn1").setIcon("sap-icon://accept");
                this.getView().byId("btn1").setText("Accept");
            }


            // swithc ~ case문을 사용한 text 변경
            /*var vText = this.getView().byId("btn1").getText();

            switch(vText){
                case "Button" : 
                vText = "Save"
                this.getView().byId("btn1").setText("Save");
                break;

                case "Save" : 
                this.getView().byId("btn1").setText("Button");
                break;

            };
            */



        }
    });
});