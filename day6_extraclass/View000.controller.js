sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel,MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day6extraclass.controller.View000", {
        onInit() {

            let oData = {
                Info: {
                    name: "홍길동",
                    age: 21,
                    job: "컴퓨터공학"
                }
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);

            var oData2 = {
                fruits: ["사과", "바나나", "포도", "귤", "수박"]
            };
            var oModel2 = new JSONModel(oData2);
            this.getView().setModel(oModel2,"fruit");

            var oModel3 = new JSONModel("/model/Students.json");
            this.getView().setModel(oModel3,"Students");

            var oData8 = {
                student : [
                    {"name" : "홍길동", "major" : "기계공학", "score" : "85"} ,
                    {"name" : "김철수", "major" : "화학공학", "score" : "73"} ,
                    {"name" : "이영희", "major" : "전산학", "score" : "95"} ,
                    {"name" : "박영수", "major" : "토목공학", "score" : "58"} ,
                ]
            };

            var oModel8 = new JSONModel(oData8);
            this.getView().setModel(oModel8,"Stuinfo");

        },
        onPress() {
            for (let i = 1; i < 6; i++) {
                if (i % 2 == 0) {
                    console.log(i + "는 짝수입니다.")
                }
                else {
                    console.log(i + "는 홀수입니다.")
                }

            }
        },
        onPress2() {
            var a = this.getView().byId("ipt1").getValue();
            if (a >= 90) {
                this.getView().byId("text1").setText("A등급");
            }
            else if (a >= 80) {
                this.getView().byId("text1").setText("B등급");
            } else if (a >= 70) {
                this.getView().byId("text1").setText("C등급");
            } else {
                this.getView().byId("text1").setText("불합격");
            }

        },
        onPress3() {
            let a = ["사과", "바나나", "포도", "귤", "수박"]

            for (let i of a) {
                console.log("과일:" + i)
            }
        },
        onPress4() {
            let a = {
                name: "홍길동",
                age: 21,
                major: "Computer Science"
            }

            for (let i in a){
                console.log(i+":"+a[i]);
            }
        },
        onPress6(){
            var oModel = this.getView().getModel("fruit");
            var fruits = oModel.getData().fruits;
            console.log("과일 분류 결과")
            for(let i of fruits){
                if(i=='수박'){
                    console.log(i+" -> 여름 과일");
                }
                else{
                    console.log(i+" -> 일반 과일");
                }
            }
        },
        onPress7(){
            console.log("합격자 명단");
            var oModel = this.getView().getModel("Students");
            var student = oModel.getData().students;
            for(let i of student){
                if(i.score >= 60){
                    console.log(i.name+" - "+i.score+"점 합격");
                }
                else{
                    console.log(i.name+" - "+i.score+"점 불합격");
                }
            }
        },
        onPress8(){
            var oModel = this.getView().getModel("Stuinfo");
            var student = oModel.getData().student;

            console.log("전체 학생 목록");
            for(let i of student){
                console.log(i.name + " / " + i.major + " / " + i.score + "점" );
            }

            console.log("80점 이상 학생 명단");
            
            for(let i of student){
                if(i.score >= 80){
                    console.log(i.name + " (" + i.major + ") - " + i.score + "점");
                }
            }

            MessageToast.show("학생 목록이 콘솔에 출력되었습니다.");
        },
        onPress9(){
            var oModel = this.getView().getModel("Stuinfo");
            var student = oModel.getData().student;

            var Name = this.getView().byId("Name").getValue();
            var Major = this.getView().byId("Major").getValue();
            var Score = this.getView().byId("Score").getValue();

            student.push({name : Name, major : Major, score : Score});

            oModel.setData({student : student});

            console.log("현재 학생 목록");
            for(let i of student){
                console.log(i.name + " / " + i.major + " / " + i.score + "점" );
            }
            console.log("*********************");
            console.log("합격자 명단");
            
            for(let i of student){
                if(i.score >= 60){
                    console.log(i.name + " (" + i.major + ") 합격 ");
                }
                else{
                    console.log(i.name + " (" + i.major + ") 불합격 ");
                }
            }
            console.log("*********************");
            MessageToast.show("학생이 추가되었습니다.");
        }
    });
});