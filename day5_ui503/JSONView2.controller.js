let aAirline = ['AA', 'KA', 'LH', 'DL', 'QA']
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day5ui503.controller.JSONView2", {
        onInit() {
            let oData = {
                Info: [
                    { "id": "asdf", "pw": "asdf" },
                    { "id": "dmstjd", "pw": "dmstjd" }
                ]
            };
            var oInfo = new JSONModel(oData);
            this.getView().setModel(oInfo);

        },
        onPress() {
            var val = this.getView().byId("ipt1").getValue();
            var j;

            for (let i of aAirline) {
                if (val == i) {
                    j = i;
                    break;
                }
            }

            if (j == 'KA') {
                this.getView().byId("ipt1").setValue("Korean Air");
            }
            else if (j == 'DL') {
                this.getView().byId("ipt1").setValue("Delta Air");
            }
            else if (j == 'QA') {
                this.getView().byId("ipt1").setValue("Qatar Air");
            }
            else {
                this.getView().byId("ipt1").setValue("Nothing");
            }
        },
        onPress2() {
            var val = this.getView().byId("ipt2").getValue();
            var j;

            for (let i of aAirline) {
                if (val == i) {
                    j = i;
                    break;
                }
            }
            switch (j) {
                case 'AA':
                    this.getView().byId("ipt2").setValue("America Air");
                    break;
                case 'LH':
                    this.getView().byId("ipt2").setValue("Luft Hansa");
                    break;
                default:
                    this.getView().byId("ipt2").setValue("Etc");
                    break;
            }
        },
        onLogin() {
            var oID = this.getView().getModel().getData().Info;
            var vID = this.getView().byId("id1").getValue();
            var vPW = this.getView().byId("pw1").getValue();

            if (vID == "" || vPW == "") {
                    alert('아이디 또는 비밀번호를 입력하세요.');
                }

            for (let i of oID) {

                console.log(i.id)

                
                if (i.id == vID) {
                    alert('아이디가 올바르지 않습니다.');
                }
                else if (i.pw != vPW) {
                    alert('비밀번호가 틀립니다.');   
                }
                else{
                    alert(i.id + '님 반갑습니다!');  
                }

            }
        }
    });
});