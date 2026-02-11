var aArray = ["A", "B", "C", "D"];

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("code.cl3.day4ui501.controller.Day4View01", {
        onInit() {
        },
        input_check() {
            // 배열 선언
            var aNumber = [10, 20, 30, 40, 50];

            // 배열 선언
            let vNum1 = 0, vCompare = 0;

            // 입력값 수신
            vNum1 = this.getView().byId("num1").getValue();

            // 값 추출 및 비교
            for (let val of aNumber) {

                // 일치하는 값이 있으면 별도의 변수에 저장
                if (vNum1 == val) {
                    vCompare = val;
                    break;
                }
            }

            // 메세지 처리
            if (vNum1 == vCompare) {
                alert("Match");
            }
            else {
                alert("Miss match");
            }

            // for (var i of aNumber) {

            //     if (vNum1 == i) {
            //         MessageBox.alert("Match");
            //         break;
            //     }
            //     else{
            //         alert("Miss match");
            //         break;
            //     }

            // }

        },
        onClick() {

            var vData = [10, 20, 30, 40, 50];
            var sum = 0;
            for (let i of vData) {
                sum = sum + i;
            }

            this.getView().byId("text1").setValue(sum);
        },
        onClear() {
            this.getView().byId("text1").setValue("");
        },
        cont_check() {
            let i = 0;
            while (i < 20) {
                i++;
                // if (i == 2 || i == 5 || i == 12 || i == 17) {
                //     continue;
                // }
                // console.log(i)
                switch (i) {
                    case 2:
                    case 5:
                    case 12:
                    case 17:
                        continue;
                    default:
                        console.log(i);
                }

            }
        },
        onChange(oEvent) {

            let oValue;

            // Get Event value
            oValue = oEvent.getParameters().value;

            console.log("key = ", oValue);

        },
        onAppend() {

            // Get input value
            var vVal = this.getView().byId("aval1").getValue();

            // Append to Array
            aArray.push(vVal);

            console.log("aArray = ", aArray);

        },
        onRemove() {

            // Pop to Array
            aArray.pop();
            console.log("aArray = ", aArray);

        },
        onShift() {

            // Shift to Array
            aArray.shift();
            console.log("aArray = ", aArray);

        },
        onLength() {

            //Length를 이용해서 del
            // aArray.length = 2;
            // console.log("aArray = ", aArray);

            let i = aArray.length;

            for(let index = i; index <= aArray.length; index--){
                aArray.length = index;
                console.log("aArray = ", aArray);
            }

        },
        onSplice(){
            
            //Splice를 이용해서 del
            aArray.splice(1,2,"Z");
            console.log("aArray = ", aArray);

        }

    });
});