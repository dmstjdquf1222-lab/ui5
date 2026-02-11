// 사용할 라이브러리의 주소를 지정해줌
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day11testui501.controller.Test1View01", {
        onInit() {
            // 지금 사용중인 View에서 id가 ipt1, ipt2인 객체에 Value값과 Description값을 보냄
            this.getView().byId("ipt1").setValue("Fiori 입력창");
            this.getView().byId("ipt1").setDescription("피오리 입력창 입니다.");

            this.getView().byId("ipt2").setValue("RTX 1253");
            this.getView().byId("ipt2").setDescription("30Ton");

        },
        // view에서 onFor이라는 이벤트(press) 발생시 아래 함수 실행
        onFor() {
            // for,while,for+whil 구분
            console.log("**************for문**************");
            // for문 i의 초기값과 조건값, 증감분 설정
            for (let i = 2; i < 10; i++) {
                // i가 1씩 증가할때마다 단수를 표시 하는 구문. 즉 단수끼리의 구분을 짓기 위한 출력
                console.log("-----" + i + "단-----");
                // i가 1 증가할때 for문을 한번 더 사용하여 j값의 초기,조건값 설정후 실행
                for (let j = 1; j < 10; j++) {
                    // i 가 1증가할때 j는 1에서부터 9까지 1씩 증가하여 곱셈 연산 실행후 console.log를 통하여 출력
                    console.log(i + "x" + j + "=" + i * j);
                }
            }
            // for,while,for+whil 구분
            console.log("******************************************");
        },
        // view에서 onWhile이라는 이벤트(press) 발생시 아래 함수 실행
        onWhile() {
            // for,while,for+whil 구분
            console.log("**************while문**************");
            // i의 초기값 설정
            var i = 2;
            // i의 조건값 설정
            while (i < 10) {
                // i가 1증가 할때마다, 즉 구구단의 단수가 올라갈때마다 곱해지는 수(j)를 초기화(초기값) 해주어야 함.
                var j = 1;
                // i가 1씩 증가할때마다 단수를 표시 하는 구문. 즉 단수끼리의 구분을 짓기 위한 출력
                console.log("-----" + i + "단-----");
                // j의 조건값 설정
                while (j < 10) {
                    // i 가 1증가할때 j는 1에서부터 9까지 1씩 증가하여 곱셈 연산 실행후 console.log를 통하여 출력
                    console.log(i + "x" + j + "=" + i * j);
                    // j의 증감분 설정
                    j++;
                }
                // i의 증감분 설정
                i++;
            }
            // for,while,for+whil 구분
            console.log("******************************************");
        },
        // view에서 onForwhile이라는 이벤트(press) 발생시 아래 함수 실행
        onForwhile() {
            // for,while,for+whil 구분
            console.log("**************for문+while문**************");
            // i의 초기값 설정
            var i = 2;
            while (i < 10) {
                // i가 1씩 증가할때마다 단수를 표시 하는 구문. 즉 단수끼리의 구분을 짓기 위한 출력
                console.log("-----" + i + "단-----");
                // i가 1씩 증가할때마다 for문을 사용하여 j값의 초기,조건값 설정후 실행
                for (let j = 1; j < 10; j++) {
                    // i 가 1증가할때 j는 1에서부터 9까지 1씩 증가하여 곱셈 연산 실행후 console.log를 통하여 출력
                    console.log(i + "x" + j + "=" + i * j);
                }
                // i의 증감분 설정
                i++;
            }
            // for,while,for+whil 구분
            console.log("******************************************");
        },
        // view에서 onClick이라는 이벤트(press) 발생시 아래 함수 실행
        onClick() {
            // for문 i의 초기값과 조건값, 증감분 설정
            for (let i = 2; i < 10; i++) {
                // 지금사용하고 있는 View에 id가 ipt3인 객체의 Value값을 가져온후, if문을 사용하여 i값과 비교했을때 일치하면 아래 구문 실행
                if (this.getView().byId("ipt3").getValue() == i)
                    // if문의 조건에 충족하면 continue를 사용하여 continue 아래 구문을 한번 스킵.
                    // 반복문을 빠져나가는 break와는 다르게 한번 skip후 계속 진행.
                    continue;
                // i가 1씩 증가할때마다 단수를 표시 하는 구문. 즉 단수끼리의 구분을 짓기 위한 출력
                console.log("-----" + i + "단-----");
                // i가 1씩 증가할때마다 for문을 사용하여 j값의 초기,조건값 설정후 실행
                for (let j = 1; j < 10; j++) {
                    // i 가 1증가할때 j는 1에서부터 9까지 1씩 증가하여 곱셈 연산 실행후 console.log를 통하여 출력
                    console.log(i + "x" + j + "=" + i * j);
                }
            }
        },
        // view에서 onClick2이라는 이벤트(press) 발생시 아래 함수 실행
        onClick2() {
            // for문 i의 초기값과 조건값, 증감분 설정. i는 2부터 시작하여 2씩 증가해야하기 때문에 i = i+2 설정.
            for (let i = 2; i < 10; i += 2) {
                // i가 1씩 증가할때마다 단수를 표시 하는 구문. 즉 단수끼리의 구분을 짓기 위한 출력
                console.log("-----" + i + "단-----");
                // i가 1씩 증가할때마다 for문을 한번 더 사용하여 j값의 초기,조건값 설정후 실행
                for (let j = 1; j < 10; j++) {
                    // i 가 1증가할때 j는 1에서부터 9까지 1씩 증가하여 곱셈 연산 실행후 console.log를 통하여 출력
                    console.log(i + "x" + j + "=" + i * j);
                }
            }
        },
        // view에서 onClick3이라는 이벤트(press) 발생시 아래 함수 실행
        onClick3() {
            //  10,20,30,40,50 의 객체를 가진 배열 생성
            var vData = [10, 20, 30, 40, 50];
            // 곱셈값을 저장해줄 변수 선언 후 1로 선언.(안해줄시 변수안에 랜덤값이 생기기때문)
            var Result = 1;
            // for of를 사용하여 vData배열 안에 있는 객체를 i변수 안에 넣으면서 반복문 실행
            for (let i of vData) {
                // Result 안에 for문이 돌아가면서 저장되는 변수 i의 값을 곱하면서 넣어줌
                Result *= i;
            }
            // 사용하고 있는 View에 txt1 id를 가를 가진객체에 Result 값을 텍스트로 보냄
            this.getView().byId("txt1").setText(Result);
        }
    });
});