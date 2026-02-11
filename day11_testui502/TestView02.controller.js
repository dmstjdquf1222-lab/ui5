// 계산기의 버튼 값을 받아와 저장해주는 전역변수
var calcul = '';
// 계산기의 저장해둔 calcul의 값들을 계산해주는 전역변수
var result = '';
// 사용할 라이브러리의 주소를 지정해준다
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day11testui502.controller.TestView02", {
        onInit() {
            // oData 안에 객체가 들어있는 배열 vArray를 선언
            var oData = {
                vArray: [
                    { Player: "하트", Team: "NC" },
                    { Player: "네일", Team: "KIA" },
                    { Player: "헤이수스", Team: "키움" },
                    { Player: "원태인", Team: "삼성" },
                    { Player: "곽빈", Team: "두산" }
                ]
            }
            // oModel 안에 JSONModel 함수를 통하여 oData를 저장해준다
            let oModel = new JSONModel(oData);
            // 저장한 oData가 들어있는 oModel을 사용중인 뷰에 보내준다
            this.getView().setModel(oModel);
            // oModel 안에 JSONModel 함수를 통하여 json파일의 주소를 넣어 Open Data를 저장해준다
            let oModel2 = new JSONModel("/json/Asset.json");
            // 저장한 Open Data가 들어있는 oModel2을 "Asset"이라는 이름을 부여해 사용중인 뷰에 보내준다
            this.getView().setModel(oModel2, "Asset");
            // oModel 안에 JSONModel 함수를 통하여 json파일의 주소를 넣어 Open Data를 저장해준다
            let oModel3 = new JSONModel("/json/Company.json");
            // 저장한 Open Data가 들어있는 oModel2을 "Asset"이라는 이름을 부여해 사용중인 뷰에 보내준다
            this.getView().setModel(oModel3, "Company");
            // oData2 안에 객체가 들어있는 배열 VizSet를 선언
            var oData2 = {
                VizSet: [
                    { Player: "박해민", Assist: "1" },
                    { Player: "최지훈", Assist: "3" },
                    { Player: "신민재", Assist: "212" },
                    { Player: "문보경", Assist: "118" },
                    { Player: "박성한", Assist: "1228" }
                ]
            }
            // oModel4 안에 JSONModel 함수를 통하여 oData2를 저장해준다
            let oModel4 = new JSONModel(oData2);
            // 저장한 oData2가 들어있는 oModel4를 "VizSet"이라는 이름을 부여해 사용중인 뷰에 보내준다
            this.getView().setModel(oModel4, "VizSet");
            // oData3 안에 객체가 들어있는 배열 MicroSet을 선언
            var oData3 = {
                MicroSet: [
                    { Team: "KIA", Hit: "101" },
                    { Team: "두산", Hit: "95" },
                    { Team: "롯데", Hit: "68" },
                    { Team: "LG", Hit: "66" },
                    { Team: "SSG", Hit: "83" },
                    { Team: "키움", Hit: "63" }
                ]
            }
            // oModel5 안에 JSONModel 함수를 통하여 oData3를 저장해준다
            let oModel5 = new JSONModel(oData3);
            // 저장한 oData2가 들어있는 oModel4를 "MicroSet"이라는 이름을 부여해 사용중인 뷰에 보내준다
            this.getView().setModel(oModel5, "MicroSet");
        },
        // view에서 onClick이라는 이벤트(press) 발생시 아래 함수 실행
        onClick() {
            // vArray의 변수에 사용중인 뷰의 모델안에 있는 vArray의 데이터를 가져온다
            var vArray = this.getView().getModel().getData().vArray;
            // for of 를 사용하여 vArray의 객체 값을 반복해서 돌려주고 그에 맞는 속성을 맵핑시켜서 console.log에 출력시켜준다
            for (let i of vArray) {
                console.log("Player : " + i.Player + ", Team : " + i.Team);
            }

        },
        // view에서 onSearch이라는 이벤트(press) 발생시 oEvent라는 매개변수를 받아오며, 아래 함수 실행
        onSearch(oEvent) {
            // aFilter라는 필터 조건이 담길 배열형태의 변수를 선언
            var aFilter = [];
            // vCond라는 변수에 oEvent의 매개변수값을 받았을때 getParameter함수의 "query" 속성을 통해 파라미터값을 가져와 선언
            var vCond = oEvent.getParameter("query")
            // 변수 vCond 안에 값이 있으면 아래 로직을 실행
            if (vCond) {
                // Filter()함수를 사용하여 필터링대상(필드), 연산자, 입력값인 Value(vCond)를 push 함수를 사용해서 aFilter 배열 안에 객체형태로 조건을 저장
                aFilter.push(new Filter("Bktxt", FilterOperator.Contains, vCond));
            }
            // 사용중인 뷰의 "Asset" 아이디를 가진 개체의 "rows" 집합체를 바인딩 시켜서 aFilter 안에 있는 필터링 조건으로 필터링 진행
            this.getView().byId("Asset").getBinding("rows").filter(aFilter);

        },
        // view에서 onSearch2이라는 이벤트(press) 발생시 oEvent라는 매개변수를 받아오며, 아래 함수 실행
        onSearch2(oEvent) {
            // aFilter라는 필터 조건이 담길 배열형태의 변수를 선언
            var aFilter = [];
            // vCond라는 변수에 oEvent의 매개변수값을 받았을때 getParameter함수의 "query" 속성을 통해 파라미터값을 가져와 선언
            var vCond = oEvent.getParameter("query")
            // 변수 vCond 안에 값이 있으면 아래 로직을 실행
            if (vCond) {
                // Filter()함수를 사용하여 필터링대상(필드), 연산자, 입력값인 Value(vCond)를 push 함수를 사용해서 aFilter 배열 안에 객체형태로 조건을 저장
                aFilter.push(new Filter("Comp", FilterOperator.Contains, vCond));
            }
            // 사용중인 뷰의 "Company" 아이디를 가진 개체의 "rows" 집합체를 바인딩 시켜서 aFilter 안에 있는 필터링 조건으로 필터링 진행
            this.getView().byId("Company").getBinding("rows").filter(aFilter);

        },
        // view에서 onPress이라는 이벤트(press) 발생시 val라는 매개변수를 받아오며, 아래 함수 실행
        onPress(val){
            // 매개변수인  val안에 아무런 값이 없을때 조건문 실행
            if(val==''){
                // 전역변수인  calcul과 result 값을 초기화
                calcul = '';
                result = '';
                // 사용중인 뷰에 "ipt1" 아이디를 가진 개체에 공백을 보내줌
                this.getView().byId("ipt1").setValue("");
                return;
            };
            // 매개변수인 val의 값을 받아온다
            switch(val){
                // val의 값이 'eq'일때 전역변수인 calcul에 저장된 값들을 eval 함수를 통하여 연산후 "ipt1" 아이디를 가진 개체에 보내준다
                case 'eq' : 
                    result = eval(calcul);
                    this.getView().byId("ipt1").setValue(result);
                    break;
                // val의 값이 eq가 아닐때 전역변수 calcul 안에 매개변수인 val 값을 계속 저장하고 "ipt1" 아이디를 가진 개체에 보내준다
                default:
                    calcul += val;
                    this.getView().byId("ipt1").setValue(calcul);
                    break;
            }
        },
        // view에서 goSecond라는 이벤트(press) 발생시 아래 함수 실행
        goSecond(){
            const oRouter = this.getOwnerComponent().getRouter();
            // 이동할 뷰의 라우터 이름을 입력
			oRouter.navTo("RouteSecondTestView02");
        }
    });
});