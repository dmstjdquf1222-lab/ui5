sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/CustomListItem",
    "sap/m/Select",
    "sap/m/Input",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/ObjectStatus",
    "sap/ui/core/Item",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast,
             CustomListItem, MSelect, MInput, MVBox, MHBox, MText, MLabel,
             ObjectStatus, CoreItem, SelectDialog, StandardListItem) {
    "use strict";

    // ─── 유틸 함수 ──────────────────────────────────────
    function safe(v) {
        if (v === null || v === undefined || v === "" || v === "0000") { return "-"; }
        return String(v);
    }
    function _fmtDate(sVal) {
        if (!sVal || sVal.length < 8) { return safe(sVal); }
        var s = String(sVal).replace(/\D/g, "");
        if (s.length === 8) { return s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8); }
        return sVal;
    }
    function _fmtQty(val) {
        if (val === null || val === undefined || val === "") { return "-"; }
        var n = parseFloat(val);
        if (isNaN(n)) { return safe(val); }
        return n.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    }
    function _fmtGr(d) {
        if (!d.Mblnr || d.Mblnr === "") { return "-"; }
        var s = d.Mblnr;
        if (d.Zeile && d.Zeile !== "000" && d.Zeile !== "0000") { s += "/" + d.Zeile; }
        if (d.Mjahr && d.Mjahr !== "" && d.Mjahr !== "0000") { s += " (" + d.Mjahr + ")"; }
        return s;
    }
    function _fmtPo(d) {
        if (!d.Ebeln || d.Ebeln === "") { return "-"; }
        var s = d.Ebeln;
        if (d.Ebelp && d.Ebelp !== "" && d.Ebelp !== "00000" && d.Ebelp !== "0000") {
            s += "/" + d.Ebelp;
        }
        return s;
    }

    // ─── 상수 ───────────────────────────────────────────
    // WorkStatus 기준: PENDING(판정대기) / PASS(합격) / PARTIAL(부분합격) / FAIL(불합격·보류)
    // HOLD 는 구버전 호환용 fallback 으로만 유지
    var _STS_TEXT  = { PENDING: "판정대기", PASS: "합격", PARTIAL: "부분합격", FAIL: "불합격/보류", HOLD: "불합격/보류" };
    var _STS_STATE = { PENDING: "None", PASS: "Success", PARTIAL: "Warning", FAIL: "Error", HOLD: "Error" };
    var _STS_CSS   = { PENDING: "pend", PASS: "pass", PARTIAL: "hold", FAIL: "fail", HOLD: "fail" };

    // WorkStatus 키 정규화 (앞뒤 공백 제거 + 대문자) — DB 값에 trailing space/소문자가 섞여도 안전
    function _normKey(s) {
        return (s === null || s === undefined ? "" : String(s)).trim().toUpperCase();
    }

    // 표시용 상태: 오직 백엔드 WorkStatus 만 사용한다.
    //  - 프론트에서 ZfinalUd 등으로 판정상태를 파생/추정하지 않는다 (플래그 위조 금지).
    //  - WorkStatus 가 비어 있으면(=백엔드 미설정) "판정 전" 의미의 PENDING 으로만 표시.
    //    값 자체가 비정상이면 그것은 백엔드(WORK_STATUS 미적재) 문제다.
    function _effStatus(d) {
        if (!d) { return "PENDING"; }
        var k = _normKey(d.WorkStatus);
        if (_STS_TEXT[k]) { return k; }
        return "PENDING";
    }

    function _stsText(s)  { var k = _normKey(s); return _STS_TEXT[k]  || (s ? String(s) : "-"); }
    function _stsState(s) { return _STS_STATE[_normKey(s)] || "None"; }
    function _stsCss(s)   { return _STS_CSS[_normKey(s)]   || "pend"; }

    var LOT_SELECT = [
        "Prueflos", "Matnr", "Maktx", "Werks", "Charg",
        "Ebeln", "Ebelp", "Lifnr", "LifnrName",
        "Mblnr", "Mjahr", "Zeile",
        "GrBudat", "GrBwart", "QILgort",
        "Lmengeist", "Meins", "WorkStatus", "ZfinalUd"
    ].join(",");

    var HIST_SELECT = [
        "Mblnr", "Mjahr", "Zeile", "Bwart",
        "Matnr", "Werks", "Lgort", "Umlgo",
        "Charg", "Menge", "Meins", "Budat", "Bldat",
        "Usnam", "Sgtxt"
    ].join(",");

    // ─── 3. 검사계획 템플릿 (웹 전용 데모 — 백엔드 미저장) ──────────────
    //  실제 측정 항목/측정값은 백엔드에서 내려오지 않으므로, 프론트에서 임의로
    //  구성한 검사 템플릿 + 자동 생성 측정값으로 화면을 채운다. (localStorage 보존)
    //  모든 자재 공통 항목만 유지: 외관 검사 / 기능 검사
    var INSPECTION_PLAN_COMMON = [
        { id: "EXT",  name: "외관 검사", subText: "스크래치·변형·이물", type: "select", standard: "이상 없음", options: ["이상 없음", "경미한 흠집", "불량"] },
        { id: "FUNC", name: "기능 검사", subText: "기본 기능·작동 확인", type: "select", standard: "정상",      options: ["정상", "주의", "불량"] }
    ];

    var ADDITIONAL_PLAN_BY_MATNR = {
        "RMBAT110": [
            { id: "AD1", name: "개방전압 테스트", type: "number", standard: "3.55~3.75V", min: 3.55, max: 3.75, unit: "V", nominal: "3.6" },
            { id: "AD2", name: "용량 테스트", type: "number", standard: "2500~2700mAh", min: 2500, max: 2700, unit: "mAh", nominal: "2600" }
        ],
        "RMBAT200": [
            { id: "AD1", name: "동작전압 테스트", type: "number", standard: "30.0~42.0V", min: 30, max: 42, unit: "V", nominal: "36" },
            { id: "AD2", name: "과전류 차단 테스트", type: "number", standard: "28~35A", min: 28, max: 35, unit: "A", nominal: "30" }
        ],
        "RMBAT210": [
            { id: "AD1", name: "동작전압 테스트", type: "number", standard: "30.0~42.0V", min: 30, max: 42, unit: "V", nominal: "36" },
            { id: "AD2", name: "과전류 차단 테스트", type: "number", standard: "28~35A", min: 28, max: 35, unit: "A", nominal: "30" }
        ],
        "RMBAT220": [
            { id: "AD1", name: "동작전압 테스트", type: "number", standard: "40.0~54.6V", min: 40, max: 54.6, unit: "V", nominal: "48" },
            { id: "AD2", name: "과전류 차단 테스트", type: "number", standard: "28~35A", min: 28, max: 35, unit: "A", nominal: "30" }
        ],
        "RMBAT300": [
            { id: "AD1", name: "중량 검사", type: "number", standard: "0.427~0.473KG", min: 0.427, max: 0.473, unit: "KG", nominal: "0.45" },
            { id: "AD2", name: "체결부 검사", type: "select", standard: "정상", options: ["정상", "헐거움", "불량"] }
        ],
        "RMBAT400": [
            { id: "AD1", name: "극성 검사", type: "select", standard: "정상", options: ["정상", "역결선", "불량"] },
            { id: "AD2", name: "접촉저항 테스트", type: "number", standard: "10mΩ 이하", min: undefined, max: 10, unit: "mΩ", nominal: "10 이하" }
        ],
        "RMBAT500": [
            { id: "AD1", name: "중량 검사", type: "number", standard: "0.57~0.63KG", min: 0.57, max: 0.63, unit: "KG", nominal: "0.6" },
            { id: "AD2", name: "체결부 검사", type: "select", standard: "정상", options: ["정상", "헐거움", "불량"] }
        ],
        "RMBAT611": [
            { id: "AD1", name: "팩 전압 테스트", type: "number", standard: "35.0~42.0V", min: 35, max: 42, unit: "V", nominal: "36" },
            { id: "AD2", name: "용량 테스트", type: "number", standard: "9.5~10.5Ah", min: 9.5, max: 10.5, unit: "Ah", nominal: "10" }
        ],
        "RMBAT612": [
            { id: "AD1", name: "팩 전압 테스트", type: "number", standard: "35.0~42.0V", min: 35, max: 42, unit: "V", nominal: "36" },
            { id: "AD2", name: "용량 테스트", type: "number", standard: "14.25~15.75Ah", min: 14.25, max: 15.75, unit: "Ah", nominal: "15" }
        ],
        "RMBAT623": [
            { id: "AD1", name: "팩 전압 테스트", type: "number", standard: "46.0~54.6V", min: 46, max: 54.6, unit: "V", nominal: "48" },
            { id: "AD2", name: "용량 테스트", type: "number", standard: "19.0~21.0Ah", min: 19, max: 21, unit: "Ah", nominal: "20" }
        ],
        "RMBDY100": [
            { id: "AD1", name: "레일 간격 검사", type: "number", standard: "43~45mm", min: 43, max: 45, unit: "mm", nominal: "44" },
            { id: "AD2", name: "쿠션 검사", type: "select", standard: "정상", options: ["정상", "꺼짐", "불량"] }
        ],
        "RMBDY101": [
            { id: "AD1", name: "레일 간격 검사", type: "number", standard: "43~45mm", min: 43, max: 45, unit: "mm", nominal: "44" },
            { id: "AD2", name: "쿠션 검사", type: "select", standard: "정상", options: ["정상", "꺼짐", "불량"] }
        ],
        "RMBDY200": [
            { id: "AD1", name: "나사규격 검사", type: "number", standard: "9/16", min: undefined, max: undefined, unit: "inch", nominal: "9/16" },
            { id: "AD2", name: "회전 검사", type: "select", standard: "정상", options: ["정상", "소음", "불량"] }
        ],
        "RMBRK100": [
            { id: "AD1", name: "작동감 검사", type: "select", standard: "정상", options: ["정상", "뻑뻑함", "불량"] },
            { id: "AD2", name: "레버 간격 검사", type: "number", standard: "65~75mm", min: 65, max: 75, unit: "mm", nominal: "70" }
        ],
        "RMBRK210": [
            { id: "AD1", name: "외경 검사", type: "number", standard: "159.5~160.5mm", min: 159.5, max: 160.5, unit: "mm", nominal: "160" },
            { id: "AD2", name: "두께 검사", type: "number", standard: "1.75~1.85mm", min: 1.75, max: 1.85, unit: "mm", nominal: "1.8" }
        ],
        "RMBRK220": [
            { id: "AD1", name: "외경 검사", type: "number", standard: "179.5~180.5mm", min: 179.5, max: 180.5, unit: "mm", nominal: "180" },
            { id: "AD2", name: "두께 검사", type: "number", standard: "1.75~1.85mm", min: 1.75, max: 1.85, unit: "mm", nominal: "1.8" }
        ],
        "RMBRK310": [
            { id: "AD1", name: "외경 검사", type: "number", standard: "179.5~180.5mm", min: 179.5, max: 180.5, unit: "mm", nominal: "180" },
            { id: "AD2", name: "두께 검사", type: "number", standard: "1.75~1.85mm", min: 1.75, max: 1.85, unit: "mm", nominal: "1.8" }
        ],
        "RMBRK320": [
            { id: "AD1", name: "외경 검사", type: "number", standard: "179.5~180.5mm", min: 179.5, max: 180.5, unit: "mm", nominal: "180" },
            { id: "AD2", name: "두께 검사", type: "number", standard: "1.75~1.85mm", min: 1.75, max: 1.85, unit: "mm", nominal: "1.8" }
        ],
        "RMBRK410": [
            { id: "AD1", name: "작동압 검사", type: "select", standard: "정상", options: ["정상", "밀림", "불량"] },
            { id: "AD2", name: "누유 검사", type: "select", standard: "없음", options: ["없음", "의심", "누유"] }
        ],
        "RMBRK420": [
            { id: "AD1", name: "작동압 검사", type: "select", standard: "정상", options: ["정상", "밀림", "불량"] },
            { id: "AD2", name: "누유 검사", type: "select", standard: "없음", options: ["없음", "의심", "누유"] }
        ],
        "RMCTL100": [
            { id: "AD1", name: "전압 테스트", type: "number", standard: "31.0~42.0V", min: 31, max: 42, unit: "V", nominal: "36" },
            { id: "AD2", name: "무부하 전류 테스트", type: "number", standard: "1.5A 이하", min: undefined, max: 1.5, unit: "A", nominal: "1.5 이하" }
        ],
        "RMCTL200": [
            { id: "AD1", name: "표시 동작 검사", type: "select", standard: "정상", options: ["정상", "깜빡임", "불량"] },
            { id: "AD2", name: "버튼/통신 검사", type: "select", standard: "정상", options: ["정상", "지연", "불량"] }
        ],
        "RMCTL300": [
            { id: "AD1", name: "신호출력 검사", type: "select", standard: "정상", options: ["정상", "간헐", "불량"] },
            { id: "AD2", name: "출력전압 테스트", type: "number", standard: "0.8~4.2V", min: 0.8, max: 4.2, unit: "V", nominal: "0.8~4.2" }
        ],
        "RMCTL400": [
            { id: "AD1", name: "도통 검사", type: "select", standard: "정상", options: ["정상", "단선", "오배선"] },
            { id: "AD2", name: "절연저항 테스트", type: "number", standard: "10MΩ 이상", min: 10, max: undefined, unit: "MΩ", nominal: "10 이상" }
        ],
        "RMCTL500": [
            { id: "AD1", name: "도통 검사", type: "select", standard: "정상", options: ["정상", "단선", "오배선"] },
            { id: "AD2", name: "절연저항 테스트", type: "number", standard: "10MΩ 이상", min: 10, max: undefined, unit: "MΩ", nominal: "10 이상" }
        ],
        "RMCTL600": [
            { id: "AD1", name: "길이 검사", type: "number", standard: "1470~1530mm", min: 1470, max: 1530, unit: "mm", nominal: "1500" },
            { id: "AD2", name: "누유 검사", type: "select", standard: "없음", options: ["없음", "의심", "누유"] }
        ],
        "RMDRV100": [
            { id: "AD1", name: "링크수 검사", type: "number", standard: "116~116L", min: 116, max: 116, unit: "L", nominal: "116" },
            { id: "AD2", name: "피치 검사", type: "number", standard: "12.65~12.75mm", min: 12.65, max: 12.75, unit: "mm", nominal: "12.7" }
        ],
        "RMDRV101": [
            { id: "AD1", name: "링크수 검사", type: "number", standard: "116~116L", min: 116, max: 116, unit: "L", nominal: "116" },
            { id: "AD2", name: "피치 검사", type: "number", standard: "12.65~12.75mm", min: 12.65, max: 12.75, unit: "mm", nominal: "12.7" }
        ],
        "RMDRV200": [
            { id: "AD1", name: "무부하 전류 테스트", type: "number", standard: "1.8A 이하", min: undefined, max: 1.8, unit: "A", nominal: "1.8 이하" },
            { id: "AD2", name: "출력 테스트", type: "number", standard: "240~300W", min: 240, max: 300, unit: "W", nominal: "250" }
        ],
        "RMDRV300": [
            { id: "AD1", name: "암 길이 검사", type: "number", standard: "169~171mm", min: 169, max: 171, unit: "mm", nominal: "170" },
            { id: "AD2", name: "체인링 검사", type: "number", standard: "38~38T", min: 38, max: 38, unit: "T", nominal: "38" }
        ],
        "RMDRV400": [
            { id: "AD1", name: "치형 검사", type: "select", standard: "정상", options: ["정상", "마모", "파손"] },
            { id: "AD2", name: "기어 단수 검사", type: "number", standard: "9~9단", min: 9, max: 9, unit: "단", nominal: "9" }
        ],
        "RMDRV500": [
            { id: "AD1", name: "치형 검사", type: "select", standard: "정상", options: ["정상", "마모", "파손"] },
            { id: "AD2", name: "기어 단수 검사", type: "number", standard: "9~9단", min: 9, max: 9, unit: "단", nominal: "9" }
        ],
        "RMDRV600": [
            { id: "AD1", name: "나사규격 검사", type: "number", standard: "9/16", min: undefined, max: undefined, unit: "inch", nominal: "9/16" },
            { id: "AD2", name: "회전 검사", type: "select", standard: "정상", options: ["정상", "소음", "불량"] }
        ],
        "RMDSP100": [
            { id: "AD1", name: "표시 동작 검사", type: "select", standard: "정상", options: ["정상", "깜빡임", "불량"] },
            { id: "AD2", name: "버튼/통신 검사", type: "select", standard: "정상", options: ["정상", "지연", "불량"] }
        ],
        "RMDSP200": [
            { id: "AD1", name: "표시 동작 검사", type: "select", standard: "정상", options: ["정상", "깜빡임", "불량"] },
            { id: "AD2", name: "버튼/통신 검사", type: "select", standard: "정상", options: ["정상", "지연", "불량"] }
        ],
        "RMFRM100": [
            { id: "AD1", name: "중량 검사", type: "number", standard: "2.09~2.31KG", min: 2.09, max: 2.31, unit: "KG", nominal: "2.2" },
            { id: "AD2", name: "헤드튜브 치수", type: "number", standard: "사양", min: undefined, max: undefined, unit: "mm", nominal: "사양" }
        ],
        "RMFRM101": [
            { id: "AD1", name: "중량 검사", type: "number", standard: "4.56~5.04KG", min: 4.56, max: 5.04, unit: "KG", nominal: "4.8" },
            { id: "AD2", name: "헤드튜브 치수", type: "number", standard: "사양", min: undefined, max: undefined, unit: "mm", nominal: "사양" }
        ],
        "RMFRM200": [
            { id: "AD1", name: "직경 검사", type: "number", standard: "31.5~31.7mm", min: 31.5, max: 31.7, unit: "mm", nominal: "31.6" },
            { id: "AD2", name: "길이 검사", type: "number", standard: "398~402mm", min: 398, max: 402, unit: "mm", nominal: "400" }
        ],
        "RMFRM300": [
            { id: "AD1", name: "내경 검사", type: "number", standard: "34.8~35.0mm", min: 34.8, max: 35, unit: "mm", nominal: "34.9" },
            { id: "AD2", name: "QR 작동 검사", type: "select", standard: "정상", options: ["정상", "뻑뻑함", "불량"] }
        ],
        "RMHDL100": [
            { id: "AD1", name: "작동감 검사", type: "select", standard: "정상", options: ["정상", "뻑뻑함", "불량"] },
            { id: "AD2", name: "레버 간격 검사", type: "number", standard: "65~75mm", min: 65, max: 75, unit: "mm", nominal: "70" }
        ],
        "RMHDL200": [
            { id: "AD1", name: "트래블 검사", type: "number", standard: "118~122mm", min: 118, max: 122, unit: "mm", nominal: "120" },
            { id: "AD2", name: "작동 검사", type: "select", standard: "정상", options: ["정상", "뻑뻑함", "불량"] }
        ],
        "RMHDL300": [
            { id: "AD1", name: "길이 검사", type: "number", standard: "128~132mm", min: 128, max: 132, unit: "mm", nominal: "130" },
            { id: "AD2", name: "내경 검사", type: "number", standard: "22.1~22.3mm", min: 22.1, max: 22.3, unit: "mm", nominal: "22.2" }
        ],
        "RMHDL400": [
            { id: "AD1", name: "폭 검사", type: "number", standard: "718~722mm", min: 718, max: 722, unit: "mm", nominal: "720" },
            { id: "AD2", name: "클램프 직경 검사", type: "number", standard: "31.7~31.900000000000002mm", min: 31.7, max: 31.9, unit: "mm", nominal: "31.8" }
        ],
        "RMHDL401": [
            { id: "AD1", name: "폭 검사", type: "number", standard: "678~682mm", min: 678, max: 682, unit: "mm", nominal: "680" },
            { id: "AD2", name: "클램프 직경 검사", type: "number", standard: "사양", min: undefined, max: undefined, unit: "mm", nominal: "사양" }
        ],
        "RMHDL402": [
            { id: "AD1", name: "폭 검사", type: "number", standard: "678~682mm", min: 678, max: 682, unit: "mm", nominal: "680" },
            { id: "AD2", name: "클램프 직경 검사", type: "number", standard: "사양", min: undefined, max: undefined, unit: "mm", nominal: "사양" }
        ],
        "RMHDL500": [
            { id: "AD1", name: "길이 검사", type: "number", standard: "128~132mm", min: 128, max: 132, unit: "mm", nominal: "130" },
            { id: "AD2", name: "내경 검사", type: "number", standard: "22.1~22.3mm", min: 22.1, max: 22.3, unit: "mm", nominal: "22.2" }
        ],
        "RMHUB000": [
            { id: "AD1", name: "무부하 전류 테스트", type: "number", standard: "1.8A 이하", min: undefined, max: 1.8, unit: "A", nominal: "1.8 이하" },
            { id: "AD2", name: "출력 테스트", type: "number", standard: "240~300W", min: 240, max: 300, unit: "W", nominal: "250" }
        ],
        "RMPNT100": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "Black", options: ["Black", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMPNT200": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "Blue", options: ["Blue", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMPNT300": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "Green", options: ["Green", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMPNT400": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "Red", options: ["Red", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMPNT500": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "White", options: ["White", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMPNT600": [
            { id: "AD1", name: "색상 검사", type: "select", standard: "Yellow", options: ["Yellow", "색차", "불량"] },
            { id: "AD2", name: "점도 검사", type: "number", standard: "22~28sec", min: 22, max: 28, unit: "sec", nominal: "25" }
        ],
        "RMWHL101": [
            { id: "AD1", name: "규격 검사", type: "number", standard: "19.8~20.2inch", min: 19.8, max: 20.2, unit: "inch", nominal: "20" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL102": [
            { id: "AD1", name: "규격 검사", type: "number", standard: "25.8~26.2inch", min: 25.8, max: 26.2, unit: "inch", nominal: "26" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL103": [
            { id: "AD1", name: "규격 검사", type: "number", standard: "27.3~27.7inch", min: 27.3, max: 27.7, unit: "inch", nominal: "27.5" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL110": [
            { id: "AD1", name: "규격 검사", type: "number", standard: "27.3~27.7inch", min: 27.3, max: 27.7, unit: "inch", nominal: "27.5" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL120": [
            { id: "AD1", name: "규격 검사", type: "number", standard: "27.3~27.7inch", min: 27.3, max: 27.7, unit: "inch", nominal: "27.5" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL201": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "20", options: ["20", "상이", "불량"] },
            { id: "AD2", name: "중량 검사", type: "number", standard: "0.63~0.77KG", min: 0.63, max: 0.77, unit: "KG", nominal: "0.7" }
        ],
        "RMWHL202": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "26", options: ["26", "상이", "불량"] },
            { id: "AD2", name: "중량 검사", type: "number", standard: "0.81~0.99KG", min: 0.81, max: 0.99, unit: "KG", nominal: "0.9" }
        ],
        "RMWHL203": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "27.5x2.8", options: ["27.5x2.8", "상이", "불량"] },
            { id: "AD2", name: "중량 검사", type: "number", standard: "0.9~1.1KG", min: 0.9, max: 1.1, unit: "KG", nominal: "1" }
        ],
        "RMWHL210": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "27.5x2.8", options: ["27.5x2.8", "상이", "불량"] },
            { id: "AD2", name: "중량 검사", type: "number", standard: "0.77~0.94KG", min: 0.77, max: 0.94, unit: "KG", nominal: "0.85" }
        ],
        "RMWHL220": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "27.5x2.8", options: ["27.5x2.8", "상이", "불량"] },
            { id: "AD2", name: "중량 검사", type: "number", standard: "0.77~0.94KG", min: 0.77, max: 0.94, unit: "KG", nominal: "0.85" }
        ],
        "RMWHL310": [
            { id: "AD1", name: "OLD 폭 검사", type: "number", standard: "99.5~100.5mm", min: 99.5, max: 100.5, unit: "mm", nominal: "100" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL320": [
            { id: "AD1", name: "OLD 폭 검사", type: "number", standard: "134.5~135.5mm", min: 134.5, max: 135.5, unit: "mm", nominal: "135" },
            { id: "AD2", name: "홀수 검사", type: "number", standard: "36~36H", min: 36, max: 36, unit: "H", nominal: "36" }
        ],
        "RMWHL410": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "27.5x1.9-2.5", options: ["27.5x1.9-2.5", "상이", "불량"] },
            { id: "AD2", name: "누기 검사", type: "select", standard: "없음", options: ["없음", "의심", "누기"] }
        ],
        "RMWHL420": [
            { id: "AD1", name: "규격 검사", type: "select", standard: "27.5x1.9-2.5", options: ["27.5x1.9-2.5", "상이", "불량"] },
            { id: "AD2", name: "누기 검사", type: "select", standard: "없음", options: ["없음", "의심", "누기"] }
        ],
        "RMWHL500": [
            { id: "AD1", name: "수량 검사", type: "select", standard: "정상", options: ["정상", "부족", "불량"] },
            { id: "AD2", name: "길이 검사", type: "number", standard: "사양", min: undefined, max: undefined, unit: "mm", nominal: "사양" }
        ],
    };

    // 문자열 → 안정적 시드 해시 (FNV-1a)
    function _seedNum(s) {
        var h = 2166136261, str = String(s == null ? "" : s);
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 16777619) >>> 0;
        }
        return h >>> 0;
    }
    // 시드 기반 0~1 의사난수 (결정적)
    function _rand01(seed) {
        return (Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0) / 4294967295;
    }
    // 검사 템플릿 = 공통 2개(외관·기능) + 자재별 추가 2개
    function _pickPlan(sMatnr) {
        var aAdd = ADDITIONAL_PLAN_BY_MATNR[sMatnr] || [];
        return INSPECTION_PLAN_COMMON.concat(aAdd);
    }
    // 검사항목 임의 측정값 생성 (로트+항목별로 항상 동일, 일부는 기준 밖이 되도록)
    function _autoValue(oChar, sLot) {
        var seed = _seedNum(sLot + "#" + oChar.id);
        if (oChar.type === "select") {
            var opts = oChar.options || [];
            if (!opts.length) { return ""; }
            return opts[Math.floor(_rand01(seed) * opts.length) % opts.length];
        }
        var hasMin = (oChar.min !== undefined && oChar.min !== null);
        var hasMax = (oChar.max !== undefined && oChar.max !== null && oChar.max < 9999);
        // 공차 없는 고정 규격값(예: 9/16, 사양) → 규격값 그대로 표시
        if (!hasMin && !hasMax) {
            return (oChar.nominal !== undefined && oChar.nominal !== null && oChar.nominal !== "")
                ? String(oChar.nominal) : (oChar.standard || "");
        }
        var lo   = hasMin ? Number(oChar.min) : 0;
        var hi   = hasMax ? Number(oChar.max) : lo + 50;
        var span = (hi - lo) || 1;
        // 기준 범위보다 약간 넓게 잡아 일부는 기준 미달/초과(불합격)로 나오게
        var v = lo - span * 0.18 + _rand01(seed) * span * 1.36;
        if (lo >= 0 && v < 0) { v = 0; }   // 음수 측정값 방지 (전류·온도 등)
        return String(Math.round(v * 10) / 10);
    }

    return Controller.extend("c1.mm.zuic1mm0023.controller.QualityInspection", {

        // ═══════════════════════════════════════════════════
        //  LIFECYCLE
        // ═══════════════════════════════════════════════════
        onInit: function () {
            console.log("[QI INIT] QualityInspection initialized");

            // UI 상태 모델
            this.getView().setModel(new JSONModel({
                editable:        true,
                statusFilter:    "",
                activeNavKey:    "ALL",
                histStatusFilter: ""
            }), "ui");

            // 2. 프론트 local inspection model 구조
            this.getView().setModel(new JSONModel({
                selectedLot:       null,
                chars:             [],
                summary: {
                    total: 0, pass: 0, fail: 0, warn: 0, pending: 0,
                    progressText: "0/0", recommended: "", recommendedMsg: ""
                },
                udCode:            "",
                recommendedUdCode: "",
                passQty:           0,
                holdQty:           0,
                movePreview:       []
            }), "inspection");

            // 내부 상태
            this._currentCtx     = null;
            this._currentLot     = null;
            this._currentLotData = null;

            // 날짜 표시
            var oNow = new Date();
            var pad  = function (n) { return String(n).padStart(2, "0"); };
            var sDate = oNow.getFullYear() + "-" + pad(oNow.getMonth() + 1) + "-" + pad(oNow.getDate());
            this.byId("txtCurrentDate").setText(sDate);

            // 초기 데이터 로드
            this._loadKpi();
            this._applyFiltersAndLoad();
        },

        // ═══════════════════════════════════════════════════
        //  NAVIGATION / MENU
        // ═══════════════════════════════════════════════════
        onToggleSideNav: function () {
            var oPage = this.byId("toolPage");
            oPage.setSideExpanded(!oPage.getSideExpanded());
        },

        onNavItemSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            this.getView().getModel("ui").setProperty("/activeNavKey", sKey);

            if (sKey === "history" || sKey === "HIST_ALL" || sKey === "HIST_PASS" || sKey === "HIST_HOLD") {
                this._goHistoryPage();
                var sHistFilter = sKey === "HIST_PASS" ? "PASS"
                                : sKey === "HIST_HOLD" ? "FAIL"   // 불합격/보류
                                : "";
                this.getView().getModel("ui").setProperty("/histStatusFilter", sHistFilter);
                this._applyHistoryFilter(sHistFilter);
                return;
            }

            var oNav = this.byId("mainNav");
            if (oNav.getCurrentPage().getId().indexOf("pageJudge") < 0) {
                oNav.backToPage(this.byId("pageJudge"));
            }

            this.getView().getModel("ui").setProperty("/statusFilter", sKey === "ALL" ? "" : sKey);
            this._applyFiltersAndLoad();
        },

        onNavBack: function () { this.byId("mainNav").back(); },

        onRefresh: function () {
            this._loadKpi();
            this._applyFiltersAndLoad();
        },

        // ═══════════════════════════════════════════════════
        //  KPI (단일 쿼리 → 클라이언트 카운트)
        // ═══════════════════════════════════════════════════
        _loadKpi: function () {
            var oModel = this.getOwnerComponent().getModel();
            var that   = this;

            oModel.bindList("/QualityLot", null, null, [], {
                $select: "Prueflos,WorkStatus,ZfinalUd"
            }).requestContexts(0, 1000)
                .then(function (aCtx) {
                    // _effStatus 로 표준화 → WorkStatus 누락분도 ZfinalUd 로 보정 집계
                    var aSts    = aCtx.map(function (c) { return _effStatus(c.getObject()); });
                    var nTotal  = aSts.length;
                    var nPend   = aSts.filter(function (s) { return s === "PENDING"; }).length;
                    var nPass   = aSts.filter(function (s) { return s === "PASS";    }).length;
                    var nPartial = aSts.filter(function (s) { return s === "PARTIAL"; }).length;
                    var nFail   = aSts.filter(function (s) { return s === "FAIL";    }).length;
                    // 합격률: 합격 건수 / 전체 건수 (부분합격 미포함)
                    var sRate   = nTotal > 0 ? Math.round((nPass / nTotal) * 100) + "%" : "-%";

                    that.byId("kpiTotalNum").setText(nTotal);
                    that.byId("kpiPendNum").setText(nPend);
                    that.byId("kpiPassNum").setText(nPass);
                    that.byId("kpiHoldNum").setText(nPartial);   // 부분합격
                    that.byId("kpiFailNum").setText(nFail);      // 불합격/보류
                    that.byId("kpiRateNum").setText(sRate);
                })
                .catch(function (e) { console.warn("[KPI] 로드 실패:", e); });
        },

        // ═══════════════════════════════════════════════════
        //  필터 / 검색
        // ═══════════════════════════════════════════════════
        onSearch:       function () { this._applyFiltersAndLoad(); },
        onFilterChange: function () { this._applyFiltersAndLoad(); },
        onLoadList:     function () { this._applyFiltersAndLoad(); },

        onResetFilter: function () {
            this.byId("fLot").setValue("");
            this.byId("fMatnr").setValue("");
            this.byId("fDateFrom").setValue("");
            this.byId("fDateTo").setValue("");
            this.getView().getModel("ui").setProperty("/statusFilter", "");
            this._applyFiltersAndLoad();
        },

        _applyFiltersAndLoad: function () {
            var sLot      = (this.byId("fLot").getValue()      || "").trim();
            var sMatnr    = (this.byId("fMatnr").getValue()    || "").trim();
            var sDateFrom = (this.byId("fDateFrom").getValue() || "").replace(/-/g, "");
            var sDateTo   = (this.byId("fDateTo").getValue()   || "").replace(/-/g, "");
            var sNavSts   = this.getView().getModel("ui").getProperty("/statusFilter");

            var aFilters = [];
            if (sNavSts)   { aFilters.push(new Filter("WorkStatus", FilterOperator.EQ, sNavSts)); }
            if (sDateFrom) { aFilters.push(new Filter("GrBudat",    FilterOperator.GE, sDateFrom)); }
            if (sDateTo)   { aFilters.push(new Filter("GrBudat",    FilterOperator.LE, sDateTo)); }

            this._loadLotList(aFilters, sLot, sMatnr);
        },

        // ─── 로트번호 서치헬프 ───────────────────────────────
        onLotValueHelp: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();

            // 매번 새로 생성 (stale 바인딩 방지)
            if (this._oLotDialog) { this._oLotDialog.destroy(); this._oLotDialog = null; }

            var oLocalModel = new JSONModel({ lots: [] });
            this._oLotDialog = new SelectDialog({
                title:      "로트번호 선택",
                noDataText: "조회 결과 없음",
                search: function (oEvt) {
                    var sVal = (oEvt.getParameter("value") || "").toLowerCase();
                    oEvt.getSource().getBinding("items").filter(
                        sVal ? [new Filter(function (oCtx2) {
                            var o = oCtx2.getObject();
                            return (o.Prueflos || "").toLowerCase().includes(sVal) ||
                                   (o.Maktx    || "").toLowerCase().includes(sVal);
                        })] : []
                    );
                },
                confirm: function (oEvt) {
                    var oSel = oEvt.getParameter("selectedItem");
                    if (oSel) {
                        that.byId("fLot").setValue(oSel.getTitle());
                        that._applyFiltersAndLoad();
                    }
                }
            });
            this._oLotDialog.setModel(oLocalModel);
            this._oLotDialog.bindItems({
                path:     "/lots",
                template: new StandardListItem({
                    title:       "{Prueflos}",
                    description: "{Maktx}",
                    info:        "{WorkStatus_txt}"
                })
            });
            this.getView().addDependent(this._oLotDialog);

            oModel.bindList("/QualityLot", null, null, [], {
                $select: "Prueflos,Matnr,Maktx,WorkStatus,ZfinalUd"
            }).requestContexts(0, 500)
                .then(function (aCtx) {
                    oLocalModel.setProperty("/lots", aCtx.map(function (c) {
                        var d = c.getObject();
                        return { Prueflos: d.Prueflos, Maktx: d.Maktx || d.Matnr, WorkStatus_txt: _stsText(_effStatus(d)) };
                    }));
                    that._oLotDialog.open("");
                })
                .catch(function (e) { console.error("[VH LOT]", e); });
        },

        // ─── 자재 서치헬프 ───────────────────────────────────
        onMatnrValueHelp: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();

            if (this._oMatnrDialog) { this._oMatnrDialog.destroy(); this._oMatnrDialog = null; }

            var oLocalModel = new JSONModel({ matnrs: [] });
            this._oMatnrDialog = new SelectDialog({
                title:      "자재 선택",
                noDataText: "조회 결과 없음",
                search: function (oEvt) {
                    var sVal = (oEvt.getParameter("value") || "").toLowerCase();
                    oEvt.getSource().getBinding("items").filter(
                        sVal ? [new Filter(function (oCtx2) {
                            var o = oCtx2.getObject();
                            return (o.Matnr || "").toLowerCase().includes(sVal) ||
                                   (o.Maktx || "").toLowerCase().includes(sVal);
                        })] : []
                    );
                },
                confirm: function (oEvt) {
                    var oSel = oEvt.getParameter("selectedItem");
                    if (oSel) {
                        // title = Matnr, description = Maktx → 자재명 입력
                        that.byId("fMatnr").setValue(oSel.getTitle());
                        that._applyFiltersAndLoad();
                    }
                }
            });
            this._oMatnrDialog.setModel(oLocalModel);
            this._oMatnrDialog.bindItems({
                path:     "/matnrs",
                template: new StandardListItem({
                    title:       "{Matnr}",
                    description: "{Maktx}"
                })
            });
            this.getView().addDependent(this._oMatnrDialog);

            oModel.bindList("/QualityLot", null, null, [], {
                $select: "Matnr,Maktx"
            }).requestContexts(0, 500)
                .then(function (aCtx) {
                    var oSeen = {}, aItems = [];
                    aCtx.forEach(function (c) {
                        var d = c.getObject();
                        if (d.Matnr && !oSeen[d.Matnr]) {
                            oSeen[d.Matnr] = true;
                            aItems.push({ Matnr: d.Matnr, Maktx: d.Maktx || "" });
                        }
                    });
                    oLocalModel.setProperty("/matnrs", aItems);
                    that._oMatnrDialog.open("");
                })
                .catch(function (e) { console.error("[VH MATNR]", e); });
        },

        // ═══════════════════════════════════════════════════
        //  로트 목록 로드
        // ═══════════════════════════════════════════════════
        _loadLotList: function (aFilters, sLot, sMatnr) {
            var oModel = this.getOwnerComponent().getModel();
            var oList  = this.byId("wlList");
            var that   = this;

            oList.destroyItems();

            oModel.bindList("/QualityLot", null, null, aFilters || [], {
                $select: LOT_SELECT
            }).requestContexts(0, 200)
                .then(function (aCtx) {
                    var aAll = aCtx;

                    // 클라이언트 필터: 로트번호
                    if (sLot) {
                        var sLotLow = sLot.toLowerCase();
                        aAll = aAll.filter(function (c) {
                            var d = c.getObject();
                            return (d.Prueflos || "").toLowerCase().includes(sLotLow);
                        });
                    }
                    // 클라이언트 필터: 자재번호/자재명
                    if (sMatnr) {
                        var sMatLow = sMatnr.toLowerCase();
                        aAll = aAll.filter(function (c) {
                            var d = c.getObject();
                            return (d.Matnr || "").toLowerCase().includes(sMatLow) ||
                                   (d.Maktx || "").toLowerCase().includes(sMatLow);
                        });
                    }

                    that.byId("wlCountBadge").setText(aAll.length + "건");

                    aAll.forEach(function (oCtx) {
                        var d    = oCtx.getObject();
                        var sEff = _effStatus(d);
                        var sSts = _stsText(sEff);
                        var sCss = _stsCss(sEff);

                        // ── 카드 빌드 ──
                        var oCard = new MVBox({ renderType: "Bare" }).addStyleClass("zLotCard");

                        // 1행: 로트번호 + 상태
                        var oTop = new MHBox({ renderType: "Bare", justifyContent: "SpaceBetween" }).addStyleClass("zLotCardTop");
                        oTop.addItem(new MText({ text: safe(d.Prueflos) }).addStyleClass("zLotPrueflos"));
                        oTop.addItem(new MText({ text: sSts }).addStyleClass("zStsTag " + sCss));
                        oCard.addItem(oTop);

                        // 2행: 자재명
                        oCard.addItem(new MText({ text: safe(d.Maktx || d.Matnr) }).addStyleClass("zLotCardMid"));

                        // 3행: 자재번호 | 배치번호
                        var aRow2 = [];
                        if (d.Matnr) { aRow2.push(d.Matnr); }
                        if (d.Charg) { aRow2.push("배치: " + d.Charg); }
                        oCard.addItem(new MText({ text: aRow2.join("  |  ") || "-" }).addStyleClass("zLotCardSub"));

                        // 4행: 공급업체
                        var sVendor = d.LifnrName || d.Lifnr;
                        if (sVendor) {
                            oCard.addItem(new MText({ text: "공급업체: " + sVendor }).addStyleClass("zLotCardSub"));
                        }

                        // 5행: GR문서 | PO번호 | 입고수량 (값 있는 것만 표시)
                        var aRow3 = [];
                        var sGr = _fmtGr(d); if (sGr !== "-") { aRow3.push("GR: " + sGr); }
                        var sPo = _fmtPo(d); if (sPo !== "-") { aRow3.push("PO: " + sPo); }
                        var sQty = _fmtQty(d.Lmengeist);
                        var sUnit = (d.Meins && d.Meins !== "") ? d.Meins : "";
                        if (sQty !== "-") { aRow3.push(sQty + (sUnit ? " " + sUnit : "")); }
                        oCard.addItem(new MText({ text: aRow3.join("  |  ") || "-" }).addStyleClass("zLotCardBot"));

                        var oItem = new CustomListItem({ type: "Active", content: [oCard] });
                        oItem.data("lotData", d);
                        oItem.data("lotCtx",  oCtx);
                        oList.addItem(oItem);
                    });
                })
                .catch(function (e) {
                    console.error("[LOT LIST] 로드 실패:", e);
                    MessageToast.show("로트 목록 조회 실패: " + (e.message || e));
                });
        },

        // ═══════════════════════════════════════════════════
        //  로트 클릭 이벤트
        // ═══════════════════════════════════════════════════
        onLotItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (!oItem) { return; }
            var oCtx = oItem.data("lotCtx");
            var d    = oItem.data("lotData");
            if (!d) { return; }
            console.log("[QI LOT CLICK]", d.Prueflos);
            this._showLotDetail(d, oCtx);
        },

        onLotSelectionChange: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (!oItem) { return; }
            var oCtx = oItem.data("lotCtx");
            var d    = oItem.data("lotData");
            if (!d) { return; }
            this._showLotDetail(d, oCtx);
        },

        // ═══════════════════════════════════════════════════
        //  로트 상세 표시
        // ═══════════════════════════════════════════════════
        _showLotDetail: function (d, oCtx) {
            console.log("[QI LOT SELECT]", d.Prueflos, d.Matnr);

            this._currentCtx     = oCtx;
            this._currentLot     = d.Prueflos;
            this._currentLotData = d;

            // QI 저장위치: 신규 필드명 QILgort 우선, 구 캐시 대응 Qilgort fallback
            var sQILgort = d.QILgort || d.Qilgort || "";

            // Object Header
            this.byId("objPrueflos").setText(safe(d.Prueflos));
            this.byId("objName").setText(safe(d.Maktx || d.Matnr));
            this.byId("objVendor").setText(safe(d.LifnrName || d.Lifnr));
            this.byId("objQtyNum").setText(_fmtQty(d.Lmengeist));
            this.byId("objQtyLbl").setText(safe(d.Meins));

            var oSts = this.byId("objStsStatus");
            var sEffSts = _effStatus(d);
            oSts.setText(_stsText(sEffSts));
            oSts.setState(_stsState(sEffSts));

            this.byId("objMblnr").setText(_fmtGr(d));
            this.byId("objEbeln").setText(_fmtPo(d));
            this.byId("objCharg").setText(safe(d.Charg));
            this.byId("objGrDate").setText(_fmtDate(d.GrBudat));
            this.byId("objWerks").setText(safe(d.Werks));
            this.byId("objLgort").setText(safe(sQILgort));

            // 재고처분 탭 수량 표시 (검사 재고 수량만)
            this.byId("qtyTotal").setText(_fmtQty(d.Lmengeist));
            this.byId("qtyUnit").setText(safe(d.Meins));

            // 판정 완료 여부 (백엔드 WorkStatus 기준). 완료 로트는 재판정 불가 → READ ONLY.
            var bJudged = (sEffSts === "PASS" || sEffSts === "PARTIAL" || sEffSts === "FAIL");
            this._bJudged = bJudged;

            // 모든 탭은 그대로 노출. 판정 완료 로트는 입력만 비활성화(읽기 전용).
            this.getView().getModel("ui").setProperty("/editable", !bJudged);
            this.byId("tabResults").setVisible(true);
            this.byId("tabUd").setVisible(true);
            this.byId("tabQty").setVisible(true);

            var oMsgStrip = this.byId("objMsgStrip");
            if (bJudged) {
                var _judgedLbl = { PASS: "합격 (A)", PARTIAL: "부분합격 (P)", FAIL: "불합격/보류 (R)" };
                oMsgStrip.setText("이미 판정 완료된 로트입니다 [" + (_judgedLbl[sEffSts] || sEffSts) +
                                  "]. 읽기 전용으로 조회만 가능합니다.");
                // 읽기전용 '안내'이므로 중립색(Information). 판정 결과 색상은 목록 배지/헤더 상태로 표현.
                oMsgStrip.setType("Information");
                oMsgStrip.setVisible(true);
            } else {
                oMsgStrip.setVisible(false);
            }

            // 판정코드 탭 초기화
            this.byId("udRbGroup").setSelectedIndex(-1);
            this.byId("udNoSelMsg").setVisible(true);
            this.byId("udSelMsg").setVisible(false);
            var oNextBtn = this.byId("btnUdNext");
            if (oNextBtn) { oNextBtn.setEnabled(false); }

            var oInsp = this.getView().getModel("inspection");
            oInsp.setProperty("/udCode",    "");
            oInsp.setProperty("/passQty",   0);
            oInsp.setProperty("/holdQty",   0);
            oInsp.setProperty("/movePreview", []);

            this.byId("dispPassQty").setValue("");
            this.byId("dispHoldQty").setValue("");
            this.byId("dispPassQtyUnit").setText(safe(d.Meins));
            this.byId("dispHoldQtyUnit").setText(safe(d.Meins));
            this.byId("btnConfirmUD").setEnabled(false);
            // 재고처분 탭 판정코드 배지 초기화
            var oUdBadge0 = this.byId("dispUdCode");
            if (oUdBadge0) { oUdBadge0.setText("판정코드 미선택"); oUdBadge0.setState("None"); }

            // 판정 완료 로트: 백엔드에 저장된 확정 판정코드(A/P/R)를 라디오에 복원 (읽기 전용)
            if (bJudged) {
                var sUd = _normKey(d.ZfinalUd);
                if (sUd !== "A" && sUd !== "P" && sUd !== "R") {
                    // ZfinalUd 가 비어 있으면 WorkStatus 로 보정
                    sUd = (sEffSts === "PASS") ? "A" : (sEffSts === "PARTIAL") ? "P" : "R";
                }
                var mUdIdx = { A: 0, P: 1, R: 2 };
                this.byId("udRbGroup").setSelectedIndex(mUdIdx[sUd]);
                oInsp.setProperty("/udCode",   sUd);
                oInsp.setProperty("/zfinalUd", sUd);

                this.byId("udNoSelMsg").setVisible(false);
                var _udSelLbl = { A: "A 합격", P: "P 부분합격", R: "R 불합격/보류" };
                var oUdSel = this.byId("udSelMsg");
                oUdSel.setText("확정된 판정: " + (_udSelLbl[sUd] || sUd) + "  (읽기 전용)");
                oUdSel.setType("Information");
                oUdSel.setVisible(true);

                // 재고처분 탭에 판정코드/수량 표시 (A·R 정확, P 는 분할정보가 백엔드에 없어 추정)
                this._applyDispForCode(sUd);
            }

            // 이동이력 초기화
            this.byId("histEmpty").setVisible(true);
            this.byId("histScroll").setVisible(false);
            var oHistFlow = this.byId("histFlow");
            if (oHistFlow && oHistFlow.removeAllItems) { oHistFlow.removeAllItems(); }
            this.byId("histCountTxt").setText("이동 0건");

            // 4. 로트 선택 시 검사계획 생성/복원 로직
            this._loadLocalPlan(d);

            // 화면 전환
            this.byId("detailEmpty").setVisible(false);
            this.byId("detailContent").setVisible(true);
            var oTabs = this.byId("detailTabs");
            if (oTabs && oTabs.setSelectedKey) { oTabs.setSelectedKey("results"); }
        },

        // ═══════════════════════════════════════════════════
        //  4. 검사계획 생성/복원 (localStorage)
        // ═══════════════════════════════════════════════════
        _getLocalKey: function (d) {
            if (d.Prueflos) { return "QI_LOCAL_RESULT_" + d.Prueflos; }
            return "QI_LOCAL_RESULT_" + (d.Mblnr || "") + "_" + (d.Zeile || "");
        },

        _loadLocalPlan: function (d) {
            // 자재별 검사 템플릿(웹 전용) 선택
            var aPlan = _pickPlan(d.Matnr);

            // 검사 입력값은 웹(localStorage)에 로트별(Prueflos)로 보존된다.
            //  - 저장된 값(사용자가 직접 입력/수정한 값)이 있으면 복원한다.
            //  - 저장된 값이 없으면 빈 값(미입력/— 선택하세요 —)으로 시작한다. (임의 자동입력 안 함)
            // 항목명/옵션/기준 골격은 항상 표준 템플릿(aPlan)에서 가져오고, value 만 적용한다.
            var oSavedMap = {};
            try {
                var sSaved = localStorage.getItem(this._getLocalKey(d));
                if (sSaved) {
                    (JSON.parse(sSaved) || []).forEach(function (c) {
                        if (c && c.id !== undefined && c.id !== null) { oSavedMap[c.id] = c; }
                    });
                }
            } catch (e) { console.warn("[QI] localStorage 복원 실패:", e); }

            var that = this;
            var aChars = aPlan.map(function (p) {
                var oSaved = oSavedMap[p.id];
                // 저장된 사용자 입력이 있으면 복원, 없으면 빈 값(미입력/— 선택하세요 —)으로 시작
                var sVal = (oSaved && oSaved.value !== undefined) ? oSaved.value : "";
                var oChar  = {
                    id:         p.id,
                    name:       p.name,
                    subText:    p.subText  || "",
                    type:       p.type,
                    standard:   p.standard || "",
                    options:    p.options  || [],
                    min:        p.min,
                    max:        p.max,
                    unit:       p.unit     || "",
                    value:      sVal,
                    judge:      "PENDING",
                    judgeText:  "미입력",
                    judgeState: "None"
                };
                var oJ = that._calcJudgeForChar(oChar);
                oChar.judge      = oJ.judge;
                oChar.judgeText  = oJ.text;
                oChar.judgeState = oJ.state;
                return oChar;
            });

            console.log("[QI LOCAL RESULTS] auto/restored", aChars);
            var oInsp = this.getView().getModel("inspection");
            oInsp.setProperty("/chars", aChars);
            this._calcSummary();
            this._renderInspectionItems();
        },

        // ═══════════════════════════════════════════════════
        //  검사항목 동적 렌더링
        // ═══════════════════════════════════════════════════
        _renderInspectionItems: function () {
            var oContainer = this.byId("inspectionContainer");
            if (!oContainer) { return; }

            // 기존 아이템 제거
            if (oContainer.removeAllItems) {
                oContainer.removeAllItems();
            } else if (oContainer.destroyItems) {
                oContainer.destroyItems();
            }

            var oInsp  = this.getView().getModel("inspection");
            var aChars = oInsp.getProperty("/chars") || [];
            var that   = this;
            // 판정 완료 로트는 읽기 전용 → 검사항목 입력 컨트롤 비활성화
            var bEditable = this.getView().getModel("ui").getProperty("/editable") !== false;

            var _JUDGE_ICON = {
                PASS: "sap-icon://accept",
                FAIL: "sap-icon://decline",
                WARN: "sap-icon://alert",
                PENDING: "sap-icon://circle-task-2"
            };

            aChars.forEach(function (oChar, idx) {

                var oJudge = new ObjectStatus({
                    text:  oChar.judgeText,
                    state: oChar.judgeState,
                    icon:  _JUDGE_ICON[oChar.judge] || ""
                }).addStyleClass("zInspJudge");

                var oInputCtrl;
                if (oChar.type === "select") {
                    oInputCtrl = new MSelect({
                        width: "260px",
                        enabled: bEditable,
                        change: (function (i) {
                            return function (oEvt) {
                                that._onCharSelectChange(i, oEvt.getSource().getSelectedKey());
                            };
                        })(idx)
                    });
                    oInputCtrl.addItem(new CoreItem({ key: "", text: "— 선택하세요 —" }));
                    (oChar.options || []).forEach(function (opt) {
                        oInputCtrl.addItem(new CoreItem({ key: opt, text: opt }));
                    });
                    oInputCtrl.setSelectedKey(oChar.value || "");
                } else {
                    oInputCtrl = new MInput({
                        width:       "220px",
                        type:        "Number",
                        enabled:     bEditable,
                        value:       oChar.value,
                        placeholder: oChar.unit || "입력",
                        liveChange:  (function (i) {
                            return function (oEvt) {
                                that._onCharInputChange(i, oEvt.getSource().getValue());
                            };
                        })(idx)
                    });
                }

                // 컬럼 1: 항목명 + 설명
                var oColName = new MVBox({
                    renderType: "Bare",
                    items: [
                        new MLabel({ text: oChar.name, design: "Bold" }).addStyleClass("zInspName"),
                        new MText({  text: oChar.subText }).addStyleClass("zInspSubtext")
                    ]
                }).addStyleClass("zInspColName");

                // 컬럼 2: 기준값
                var oColStd = new MText({ text: oChar.standard || "" }).addStyleClass("zInspColStd");

                // 컬럼 3: 입력 컨트롤 (+ 단위)
                var oColInput = new MHBox({
                    renderType: "Bare",
                    alignItems: "Center",
                    items: [ oInputCtrl ]
                }).addStyleClass("zInspColInput");
                if (oChar.type === "number" && oChar.unit) {
                    oColInput.addItem(new MText({ text: oChar.unit }).addStyleClass("zInspUnit"));
                }

                // 컬럼 4: 판정 배지
                oJudge.addStyleClass("zInspColJudge");

                var oRow = new MHBox({
                    alignItems: "Center",
                    renderType: "Bare",
                    items: [ oColName, oColStd, oColInput, oJudge ]
                }).addStyleClass("zInspRow");

                oContainer.addItem(oRow);
            });
        },

        // ═══════════════════════════════════════════════════
        //  5. 검사값 변경 및 summary 계산 로직
        // ═══════════════════════════════════════════════════
        _onCharInputChange: function (idx, sVal) {
            var oInsp  = this.getView().getModel("inspection");
            var aChars = oInsp.getProperty("/chars");
            if (!aChars[idx]) { return; }
            aChars[idx].value = sVal;
            var oJ = this._calcJudgeForChar(aChars[idx]);
            aChars[idx].judge      = oJ.judge;
            aChars[idx].judgeText  = oJ.text;
            aChars[idx].judgeState = oJ.state;
            oInsp.setProperty("/chars", aChars);
            this._updateJudgeBadge(idx, oJ);
            this._calcSummary();
            this._saveToLocalStorage();
        },

        _onCharSelectChange: function (idx, sVal) {
            var oInsp  = this.getView().getModel("inspection");
            var aChars = oInsp.getProperty("/chars");
            if (!aChars[idx]) { return; }
            aChars[idx].value = sVal;
            var oJ = this._calcJudgeForChar(aChars[idx]);
            aChars[idx].judge      = oJ.judge;
            aChars[idx].judgeText  = oJ.text;
            aChars[idx].judgeState = oJ.state;
            oInsp.setProperty("/chars", aChars);
            this._updateJudgeBadge(idx, oJ);
            this._calcSummary();
            this._saveToLocalStorage();
        },

        _updateJudgeBadge: function (idx, oJ) {
            var oContainer = this.byId("inspectionContainer");
            if (!oContainer) { return; }
            var aItems = oContainer.getItems();
            if (!aItems[idx]) { return; }
            var oRow   = aItems[idx];
            var aRow   = oRow.getItems();
            var oJudge = aRow[aRow.length - 1];
            if (oJudge && typeof oJudge.setText === "function") {
                var _icon = {
                    PASS: "sap-icon://accept",
                    FAIL: "sap-icon://decline",
                    WARN: "sap-icon://alert",
                    PENDING: "sap-icon://circle-task-2"
                };
                oJudge.setText(oJ.text);
                oJudge.setState(oJ.state);
                if (oJudge.setIcon) { oJudge.setIcon(_icon[oJ.judge] || ""); }
            }
        },

        _calcJudgeForChar: function (oChar) {
            var sVal = oChar.value;
            if (oChar.type === "select") {
                var opts = oChar.options || [];
                if (!sVal || !opts.length) {
                    return { judge: "PENDING", text: "미입력", state: "None" };
                }
                if (sVal === opts[0])                 { return { judge: "PASS", text: "합격",   state: "Success" }; }
                if (sVal === opts[opts.length - 1])   { return { judge: "FAIL", text: "불합격", state: "Error"   }; }
                return { judge: "WARN", text: "주의", state: "Warning" };
            }
            // number 타입
            if (sVal === null || sVal === undefined || sVal === "") {
                return { judge: "PENDING", text: "미입력", state: "None" };
            }
            var bHasMin = (oChar.min !== undefined && oChar.min !== null);
            var bHasMax = (oChar.max !== undefined && oChar.max !== null && oChar.max < 9999);
            // 공차 없는 고정 규격값(예: 9/16, 사양) → 합격 처리
            if (!bHasMin && !bHasMax) {
                return { judge: "PASS", text: "합격", state: "Success" };
            }
            var n = parseFloat(sVal);
            if (isNaN(n)) { return { judge: "PENDING", text: "미입력", state: "None" }; }
            var bOk = true;
            if (bHasMin && n < oChar.min) { bOk = false; }
            if (bHasMax && n > oChar.max) { bOk = false; }
            if (!bOk) { return { judge: "FAIL", text: "불합격", state: "Error" }; }
            // 기준 범위 안이지만 한계 근처면 '주의' (양쪽 한계가 유한할 때만)
            if (bHasMin && bHasMax) {
                var fMargin = (oChar.max - oChar.min) * 0.08;
                if (n <= oChar.min + fMargin || n >= oChar.max - fMargin) {
                    return { judge: "WARN", text: "주의", state: "Warning" };
                }
            }
            return { judge: "PASS", text: "합격", state: "Success" };
        },

        _calcSummary: function () {
            var oInsp  = this.getView().getModel("inspection");
            var aChars = oInsp.getProperty("/chars") || [];
            var nTotal = aChars.length;
            var nPass  = 0, nFail = 0, nWarn = 0, nPend = 0;
            aChars.forEach(function (c) {
                if      (c.judge === "PASS") { nPass++; }
                else if (c.judge === "FAIL") { nFail++; }
                else if (c.judge === "WARN") { nWarn++; }
                else                         { nPend++; }
            });

            var nDone     = nPass + nFail + nWarn;
            var sProgress = nDone + "/" + nTotal;

            // 판정코드 탭 추천에 쓰이는 코드만 계산 (화면 알림창은 띄우지 않음)
            var sRec = "";
            if (nTotal > 0) {
                if (nFail > 0)          { sRec = "R"; }   // 불합격/보류
                else if (nWarn > 0)     { sRec = "P"; }   // 부분합격
                else if (nPend === 0)   { sRec = "A"; }   // 합격
            }

            oInsp.setProperty("/summary", {
                total: nTotal, pass: nPass, fail: nFail, warn: nWarn, pending: nPend,
                progressText: sProgress, recommended: sRec
            });
            oInsp.setProperty("/recommendedUdCode", sRec);

            // 입력 진행률 바: 입력 완료율만 표시.
            // 결과색(빨강/주황)·상태아이콘(x 등)은 쓰지 않고 항상 초록 바(CSS)로 고정.
            var oBar = this.byId("inspProgBar");
            if (oBar) {
                var nPct = nTotal > 0 ? Math.round((nDone / nTotal) * 100) : 0;
                oBar.setPercentValue(nPct);
                oBar.setDisplayValue(sProgress);
                oBar.setState("None");
            }

            // 하단 요약 푸터 카운트
            var setNum = function (sId, n) {
                var o = this.byId(sId);
                if (o) { o.setText(String(n)); }
            }.bind(this);
            setNum("footPassNum", nPass);
            setNum("footFailNum", nFail);
            setNum("footWarnNum", nWarn);
            setNum("footPendNum", nPend);
        },

        _saveToLocalStorage: function () {
            var d = this._currentLotData;
            if (!d) { return; }
            var sKey   = this._getLocalKey(d);
            var aChars = this.getView().getModel("inspection").getProperty("/chars");
            try {
                localStorage.setItem(sKey, JSON.stringify(aChars));
            } catch (e) { console.warn("[QI] localStorage 저장 실패:", e); }
        },

        onSaveLocalResults: function () {
            this._saveToLocalStorage();
            MessageToast.show("로컬 저장 완료 (서버 미저장)");
        },

        onClearLocalResults: function () {
            var d = this._currentLotData;
            if (!d) { return; }
            try { localStorage.removeItem(this._getLocalKey(d)); } catch (e) { /* noop */ }
            this._loadLocalPlan(d);
            MessageToast.show("로컬 결과를 초기화했습니다.");
        },

        onDetailTabSelect: function () {
            // 재고처분 탭의 수량/판정코드 표시는 onUdNext → _applyDispForCode 및
            // 입력 change 핸들러가 관리하므로 별도 갱신 불필요.
        },

        // ═══════════════════════════════════════════════════
        //  6. 판정코드별 passQty/holdQty 계산 로직
        // ═══════════════════════════════════════════════════
        onUdRbSelect: function (oEvent) {
            var idx   = oEvent.getParameter("selectedIndex");
            // 판정코드 = ZfinalUd 직접 매핑 (A=합격 / P=부분합격 / R=불합격·보류)
            var codes = ["A", "P", "R"];
            var sCode = codes[idx];
            if (!sCode) { return; }
            console.log("[QI UD SELECT]", sCode);

            var oInsp = this.getView().getModel("inspection");
            oInsp.setProperty("/udCode",    sCode);
            oInsp.setProperty("/zfinalUd",  sCode);

            // 메시지 스트립 — 수량은 여기서 입력하지 않고 재고처분 탭에서 처리
            this.byId("udNoSelMsg").setVisible(false);
            var _rLabel = {
                A: "A 합격 (전량 SL40 → SL10)",
                P: "P 부분합격 (재고처분에서 합격수량 입력)",
                R: "R 불합격/보류 (전량 SL40 → SL50)"
            };
            var oSelMsg = this.byId("udSelMsg");
            oSelMsg.setText((_rLabel[sCode] || sCode) + " 선택됨 — [다음 — 재고처분]을 눌러 수량을 처리하세요.");
            oSelMsg.setVisible(true);

            // '다음' 버튼 활성화 (코드 선택만으로 충분)
            var oNext = this.byId("btnUdNext");
            if (oNext) { oNext.setEnabled(true); }
        },

        // 판정코드 선택 후 → 재고처분 탭으로 전환하며 코드/기본수량 표시
        onUdNext: function () {
            var oInsp = this.getView().getModel("inspection");
            var sCode = oInsp.getProperty("/udCode");
            if (!sCode) { MessageToast.show("판정코드를 선택하세요."); return; }
            var oTabs = this.byId("detailTabs");
            if (oTabs && oTabs.setSelectedKey) { oTabs.setSelectedKey("qty"); }
            this._applyDispForCode(sCode);
        },

        // 재고처분 탭에 판정코드 표시 + 코드별 기본 수량/입력가능 설정
        _applyDispForCode: function (sCode) {
            var d = this._currentLotData;
            if (!d) { return; }
            var nTotal = parseFloat(d.Lmengeist) || 0;
            var oInsp  = this.getView().getModel("inspection");

            // 코드 배지
            var _lbl   = { A: "판정: A 합격", P: "판정: P 부분합격", R: "판정: R 불합격/보류" };
            var _state = { A: "Success", P: "Warning", R: "Error" };
            var oBadge = this.byId("dispUdCode");
            if (oBadge) {
                oBadge.setText(_lbl[sCode] || ("판정: " + sCode));
                oBadge.setState(_state[sCode] || "None");
            }

            // 코드별 기본 수량 + 입력 가능 여부 (A·R 자동, P 직접 입력)
            var bEditableLot = this.getView().getModel("ui").getProperty("/editable") !== false;
            var nPass, nHold, bPInput;
            if (sCode === "A")      { nPass = nTotal; nHold = 0;      bPInput = false; }
            else if (sCode === "R") { nPass = 0;      nHold = nTotal; bPInput = false; }
            else {  // P
                nPass = oInsp.getProperty("/passQty") || 0;
                nHold = Math.max(0, nTotal - nPass);
                bPInput = true;
            }
            oInsp.setProperty("/passQty", nPass);
            oInsp.setProperty("/holdQty", nHold);

            this.byId("dispPassQty").setValue(_fmtQty(nPass));
            this.byId("dispHoldQty").setValue(_fmtQty(nHold));
            this.byId("dispPassQtyUnit").setText(d.Meins || "");
            this.byId("dispHoldQtyUnit").setText(d.Meins || "");
            this.byId("dispPassQty").setEnabled(bEditableLot && bPInput);
            this.byId("dispHoldQty").setEnabled(bEditableLot && bPInput);

            this._setQtyValidMsg(nPass, nHold, nTotal, d.Meins);
            this._updateMovePreview();
            this._updateConfirmBtn();
        },

        // 재고처분 탭 합격수량 직접 입력
        onDispPassQtyChange: function (oEvent) {
            var nPass  = parseFloat(oEvent.getSource().getValue()) || 0;
            var d      = this._currentLotData;
            if (!d) { return; }
            var nTotal = parseFloat(d.Lmengeist) || 0;
            var nHold  = Math.max(0, nTotal - nPass);
            var oInsp  = this.getView().getModel("inspection");
            oInsp.setProperty("/passQty", nPass);
            oInsp.setProperty("/holdQty", nHold);
            this.byId("dispHoldQty").setValue(_fmtQty(nHold));
            this._setQtyValidMsg(nPass, nHold, nTotal, d.Meins);
            this._updateMovePreview();
            this._updateConfirmBtn();
        },

        // 재고처분 탭 보류수량 직접 입력
        onDispHoldQtyChange: function (oEvent) {
            var nHold  = parseFloat(oEvent.getSource().getValue()) || 0;
            var d      = this._currentLotData;
            if (!d) { return; }
            var nTotal = parseFloat(d.Lmengeist) || 0;
            var nPass  = Math.max(0, nTotal - nHold);
            var oInsp  = this.getView().getModel("inspection");
            oInsp.setProperty("/passQty", nPass);
            oInsp.setProperty("/holdQty", nHold);
            this.byId("dispPassQty").setValue(_fmtQty(nPass));
            this._setQtyValidMsg(nPass, nHold, nTotal, d.Meins);
            this._updateMovePreview();
            this._updateConfirmBtn();
        },

        _setQtyValidMsg: function (nPass, nHold, nTotal, sUnit) {
            var oMsg = this.byId("dispQtyValidMsg");
            if (!oMsg) { return; }
            var nSum = nPass + nHold;
            if (Math.abs(nSum - nTotal) < 0.001) {
                oMsg.setText("합계 " + _fmtQty(nSum) + " " + (sUnit || "") + " ✓");
                oMsg.removeStyleClass("zHoldQtyText");
                oMsg.addStyleClass("zPassQtyText");
            } else {
                oMsg.setText("합계 " + _fmtQty(nSum) + " / 총 " + _fmtQty(nTotal) + " — 수량 불일치");
                oMsg.removeStyleClass("zPassQtyText");
                oMsg.addStyleClass("zHoldQtyText");
            }
        },

        // 부분합격(P) PassQty 입력
        onPassQtyChange: function (oEvent) {
            var sVal   = oEvent.getSource().getValue();
            var nPass  = parseFloat(sVal) || 0;
            var d      = this._currentLotData;
            if (!d) { return; }
            var nTotal = parseFloat(d.Lmengeist) || 0;
            var nHold  = Math.max(0, nTotal - nPass);

            var oInsp = this.getView().getModel("inspection");
            oInsp.setProperty("/passQty", nPass);
            oInsp.setProperty("/holdQty", nHold);

            var oHoldTxt = this.byId("holdQtyDisplay");
            if (oHoldTxt) { oHoldTxt.setText("보류수량: " + _fmtQty(nHold) + " " + (d.Meins || "")); }
            var oUnitTxt = this.byId("passQtyUnit");
            if (oUnitTxt) { oUnitTxt.setText(d.Meins || ""); }

            console.log("[QI QTY]", nPass, nHold, nTotal);
            this._updateMovePreview();
            this._updateConfirmBtn();
        },

        _calcAndSetQty: function (sCode) {
            var d = this._currentLotData;
            if (!d) { return; }
            var nTotal = parseFloat(d.Lmengeist) || 0;
            var nPass  = 0, nHold = 0;
            var oInsp  = this.getView().getModel("inspection");

            switch (sCode) {
                case "A":   // 합격: 전량 합격
                    nPass = nTotal;
                    nHold = 0;
                    break;
                case "P":   // 부분합격: 사용자 입력 합격수량
                    nPass = oInsp.getProperty("/passQty") || 0;
                    nHold = Math.max(0, nTotal - nPass);
                    var oUnitTxt = this.byId("passQtyUnit");
                    if (oUnitTxt) { oUnitTxt.setText(d.Meins || ""); }
                    break;
                case "R":   // 불합격/보류: 전량 보류
                    nPass = 0;
                    nHold = nTotal;
                    break;
            }

            oInsp.setProperty("/passQty", nPass);
            oInsp.setProperty("/holdQty", nHold);
            this.byId("dispPassQty").setValue(_fmtQty(nPass));
            this.byId("dispHoldQty").setValue(_fmtQty(nHold));
            this.byId("dispPassQtyUnit").setText(d.Meins || "");
            this.byId("dispHoldQtyUnit").setText(d.Meins || "");
            console.log("[QI QTY]", nPass, nHold, nTotal);
            this._updateMovePreview();
        },

        // ═══════════════════════════════════════════════════
        //  7. 이동문서 미리보기 로직
        // ═══════════════════════════════════════════════════
        _updateMovePreview: function () {
            var oInsp  = this.getView().getModel("inspection");
            var nPass  = oInsp.getProperty("/passQty") || 0;
            var nHold  = oInsp.getProperty("/holdQty") || 0;
            var d      = this._currentLotData;
            var sUnit  = d ? (d.Meins    || "") : "";
            var sFrom  = d ? (d.QILgort  || d.Qilgort || "SL40") : "SL40";

            var aMovePreview = [];
            if (nPass > 0) {
                aMovePreview.push({
                    bwart: "321",
                    state: "Success",
                    label: sFrom + "  →  SL10  (합격/가용재고)",
                    qty:   _fmtQty(nPass),
                    unit:  sUnit
                });
            }
            if (nHold > 0) {
                aMovePreview.push({
                    bwart: "322",
                    state: "Warning",
                    label: sFrom + "  →  SL50  (보류/불량재고)",
                    qty:   _fmtQty(nHold),
                    unit:  sUnit
                });
            }

            oInsp.setProperty("/movePreview", aMovePreview);
            console.log("[QI MOVE PREVIEW]", aMovePreview);
        },

        _updateConfirmBtn: function () {
            var oInsp  = this.getView().getModel("inspection");
            var sCode  = oInsp.getProperty("/udCode");
            var nPass  = oInsp.getProperty("/passQty") || 0;
            var nHold  = oInsp.getProperty("/holdQty") || 0;
            var d      = this._currentLotData;
            var nTotal = d ? (parseFloat(d.Lmengeist) || 0) : 0;
            var bEditableLot = this.getView().getModel("ui").getProperty("/editable") !== false;

            var bValid = !!(
                bEditableLot &&
                this._currentLot &&
                sCode &&
                Math.abs((nPass + nHold) - nTotal) < 0.001 &&
                (nPass + nHold) > 0
            );
            // 부분합격(P)은 합격수량이 0 초과, 전체수량 미만일 때만 확정 가능
            if (bValid && sCode === "P" && (nPass <= 0 || nPass >= nTotal)) {
                bValid = false;
            }
            var oBtn = this.byId("btnConfirmUD");
            if (oBtn) { oBtn.setEnabled(bValid); }
        },

        // ═══════════════════════════════════════════════════
        //  8. ConfirmUsageDecision Action 호출부
        // ═══════════════════════════════════════════════════
        onConfirmUD: function () {
            var that   = this;
            var oInsp  = this.getView().getModel("inspection");
            var sCode  = oInsp.getProperty("/udCode");
            var nPass  = oInsp.getProperty("/passQty") || 0;
            var nHold  = oInsp.getProperty("/holdQty") || 0;
            var d      = this._currentLotData;
            var nTotal = d ? (parseFloat(d.Lmengeist) || 0) : 0;

            if (!this._currentLot) { MessageToast.show("로트를 선택하세요."); return; }
            if (!sCode)            { MessageToast.show("판정코드를 선택하세요."); return; }
            if (Math.abs((nPass + nHold) - nTotal) >= 0.001) {
                MessageBox.warning(
                    "PassQty + HoldQty = " + nTotal + " (입고수량) 이어야 합니다.\n" +
                    "현재: " + nPass + " + " + nHold + " = " + (nPass + nHold)
                );
                return;
            }
            if (nPass < 0 || nHold < 0) { MessageBox.warning("수량은 음수가 될 수 없습니다."); return; }
            // 부분합격(P): 합격수량은 0 초과, 전체수량 미만이어야 함
            if (sCode === "P" && (nPass <= 0 || nPass >= nTotal)) {
                MessageBox.warning("부분합격은 합격수량이 0보다 크고 전체수량(" + _fmtQty(nTotal) + ")보다 작아야 합니다.");
                return;
            }

            console.log("[QI CONFIRM PARAMS]", { ZfinalUd: sCode, PassQty: nPass, HoldQty: nHold });

            MessageBox.confirm(
                "품질판정을 확정하시겠습니까?\n\n" +
                "  로트번호  : " + this._currentLot + "\n" +
                "  판정코드  : " + sCode + "\n" +
                "  합격수량  : " + _fmtQty(nPass) + " " + (d ? d.Meins : "") + "\n" +
                "  보류수량  : " + _fmtQty(nHold) + " " + (d ? d.Meins : "") + "\n\n" +
                "※ 확정 후 취소 불가. 재고가 즉시 이동됩니다.",
                {
                    title:            "품질판정 확정",
                    actions:          [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }

                        // 판정코드(A/P/R) = ZfinalUd 직접 전송
                        var sFinalUd = sCode;
                        if (sFinalUd !== "A" && sFinalUd !== "P" && sFinalUd !== "R") {
                            MessageBox.error("알 수 없는 판정코드: " + sCode);
                            return;
                        }

                        var fPassQty, fHoldQty;
                        switch (sCode) {
                            case "A": fPassQty = nTotal;                              fHoldQty = 0;                              break;
                            case "P": fPassQty = Math.max(0, parseFloat(nPass) || 0); fHoldQty = Math.max(0, nTotal - fPassQty); break;
                            case "R": fPassQty = 0;                                   fHoldQty = nTotal;                         break;
                            default:  MessageBox.error("알 수 없는 코드: " + sCode); return;
                        }

                        console.log("[CONFIRM]", { sCode: sCode, sFinalUd: sFinalUd, fPassQty: fPassQty, fHoldQty: fHoldQty });

                        that._callConfirmAction(that._currentCtx, sFinalUd, fPassQty, fHoldQty)
                            .then(function () {
                                MessageToast.show("품질판정 확정 완료 [" + sCode + "]");
                                that._loadKpi();
                                that._applyFiltersAndLoad();
                                that.getView().getModel("ui").setProperty("/editable", false);
                                var oMsg = that.byId("objMsgStrip");
                                oMsg.setText("확정 완료: " + sCode + " (ZfinalUd=" + sFinalUd +
                                             " / 합격 " + _fmtQty(fPassQty) + " / 보류 " + _fmtQty(fHoldQty) + ")");
                                oMsg.setType("Success");
                                oMsg.setVisible(true);
                                that.byId("btnConfirmUD").setEnabled(false);
                            })
                            .catch(function (oErr) {
                                var sMsg = (oErr && oErr.message) ? oErr.message : String(oErr);
                                console.error("[CONFIRM ERROR]", sMsg);
                                MessageBox.error("판정 확정 오류:\n\n" + sMsg +
                                    "\n\n▶ F12 Network POST 응답 확인\n▶ SAP ST22 확인");
                            });
                    }.bind(this)
                }
            );
        },

        _callConfirmAction: function (oCtx, sFinalUd, fPassQty, fHoldQty) {
            var oModel = this.getView().getModel();

            if (!oModel) {
                return Promise.reject(new Error("OData 모델을 찾을 수 없습니다."));
            }

            if (!oCtx) {
                return Promise.reject(new Error("선택된 로트 컨텍스트가 없습니다."));
            }

            var oAction = oModel.bindContext(
                "com.sap.gateway.srvd.zsd_c1_mm_0023_srv.v0001.ConfirmUsageDecision(...)",
                oCtx
            );

            oAction.setParameter("ZfinalUd", String(sFinalUd));
            oAction.setParameter("PassQty",  String(fPassQty));
            oAction.setParameter("HoldQty",  String(fHoldQty));

            return oAction.execute();
        },

        // ═══════════════════════════════════════════════════
        //  이동이력 탭 (QualityMoveHist + Sgtxt 필터)
        // ═══════════════════════════════════════════════════
        onLoadHistTab: function () {
            var sLot = this._currentLot;
            if (!sLot) { MessageToast.show("로트를 먼저 선택하세요."); return; }
            this._loadHistoryForDetail(sLot);
        },

        _loadHistoryForDetail: function (sLot) {
            // 이동이력은 QualityMoveHist 를 Prueflos 기준으로 조회
            var oModel  = this.getOwnerComponent().getModel();
            var that    = this;
            var oFlow   = this.byId("histFlow");
            var HIST_SELECT_WITH_PRUEFLOS = HIST_SELECT + ",Prueflos";

            // ── 진단 로그: 프론트가 실제로 보내는 쿼리 (Network 탭과 대조용) ──
            //   동일 쿼리를 브라우저에서 직접 확인: /QualityMoveHist?$filter=Prueflos eq '<lot>'
            console.log("[QI HIST][REQUEST]", {
                entitySet: "/QualityMoveHist",
                filter:    "Prueflos eq '" + sLot + "'",
                select:    HIST_SELECT_WITH_PRUEFLOS
            });

            this.byId("histEmpty").setVisible(false);
            this.byId("histScroll").setVisible(false);
            this.byId("histCountTxt").setText("이동이력 조회 중...");
            if (oFlow && oFlow.removeAllItems) { oFlow.removeAllItems(); }

            oModel.bindList("/QualityMoveHist", null, null, [
                new Filter("Prueflos", FilterOperator.EQ, sLot)
            ], { $select: HIST_SELECT_WITH_PRUEFLOS }).requestContexts(0, 200)
                .then(function (aCtx) {
                    console.log("[QI HIST][RESPONSE] rows =", aCtx.length, "(쿼리 정상)");
                    if (!aCtx.length) {
                        // 쿼리는 정상, 결과 0건 → 백엔드에 해당 Prueflos 이동문서가 없음
                        // (현재 백엔드는 321/322 자재문서 생성 로직 미구현 → 정상적으로 빈 상태)
                        that.byId("histCountTxt").setText("이동 0건 (쿼리 정상 · 백엔드 데이터 없음)");
                        that.byId("histEmpty").setVisible(true);
                        return;
                    }
                    that.byId("histCountTxt").setText("이동 " + aCtx.length + "건");
                    that.byId("histScroll").setVisible(true);
                    aCtx.forEach(function (c) {
                        var d        = c.getObject();
                        var sBwartCss = (d.Bwart === "321") ? "zPassQtyText" : "zHoldQtyText";
                        var oCard = new MVBox({ renderType: "Bare" }).addStyleClass("zHistCard");
                        var oTop  = new MHBox({ renderType: "Bare" }).addStyleClass("zHistTop");
                        oTop.addItem(new MText({ text: safe(d.Bwart) }).addStyleClass("zHistBwart " + sBwartCss));
                        oTop.addItem(new MText({ text: safe(d.Mblnr) + "/" + safe(d.Zeile) + " (" + safe(d.Mjahr) + ")" }).addStyleClass("zHistDoc"));
                        oTop.addItem(new MText({ text: _fmtDate(d.Budat) }).addStyleClass("zHistDate"));
                        oCard.addItem(oTop);
                        oCard.addItem(new MText({ text: safe(d.Lgort) + " → " + safe(d.Umlgo) + "  |  " + _fmtQty(d.Menge) + " " + safe(d.Meins) }).addStyleClass("zHistMid"));
                        oCard.addItem(new MText({ text: safe(d.Sgtxt) + "  /  " + safe(d.Usnam) }).addStyleClass("zHistBot"));
                        oFlow.addItem(oCard);
                    });
                })
                .catch(function (e) {
                    // 쿼리 자체가 거부됨(HTTP 4xx/5xx) → 백엔드 문제(필드/필터/권한 등)
                    console.error("[QI HIST][ERROR] 쿼리 실패 — 백엔드가 거부함", {
                        message: e && e.message,
                        error:   e
                    });
                    that.byId("histEmpty").setVisible(true);
                    that.byId("histCountTxt").setText("조회 실패 (쿼리 거부됨 · 콘솔 확인)");
                });
        },

        // ═══════════════════════════════════════════════════
        //  이력조회 PAGE 2
        // ═══════════════════════════════════════════════════
        _goHistoryPage: function () {
            this.byId("mainNav").to(this.byId("pageHistory"));
            var sHistFilter = this.getView().getModel("ui").getProperty("/histStatusFilter") || "";
            this._loadHistLotList(sHistFilter);
        },

        _applyHistoryFilter: function (sStatus) {
            this._loadHistLotList(sStatus);
        },

        _loadHistLotList: function (sStatusFilter) {
            var oModel = this.getOwnerComponent().getModel();
            var oList  = this.byId("histLotList");
            var that   = this;
            oList.destroyItems();

            var aFilters = [];
            if (sStatusFilter) {
                aFilters.push(new sap.ui.model.Filter("WorkStatus", sap.ui.model.FilterOperator.EQ, sStatusFilter));
            }

            oModel.bindList("/QualityLot", null, null, aFilters, {
                $select: "Prueflos,Matnr,Maktx,WorkStatus,ZfinalUd,GrBudat"
            }).requestContexts(0, 200)
                .then(function (aCtx) {
                    aCtx.forEach(function (oCtx) {
                        var d    = oCtx.getObject();
                        var sEff = _effStatus(d);
                        var oCard = new MVBox({ renderType: "Bare" }).addStyleClass("zLotCard");
                        var oTop  = new MHBox({ renderType: "Bare", justifyContent: "SpaceBetween" }).addStyleClass("zLotCardTop");
                        oTop.addItem(new MText({ text: safe(d.Prueflos) }).addStyleClass("zLotPrueflos"));
                        oTop.addItem(new MText({ text: _stsText(sEff) }).addStyleClass("zStsTag " + _stsCss(sEff)));
                        oCard.addItem(oTop);
                        oCard.addItem(new MText({ text: safe(d.Maktx || d.Matnr) }).addStyleClass("zLotCardMid"));
                        oCard.addItem(new MText({ text: _fmtDate(d.GrBudat) }).addStyleClass("zLotCardBot"));
                        var oItem = new CustomListItem({
                            type:    "Active",
                            content: [oCard]
                        });
                        oItem.data("prueflos", d.Prueflos);
                        oList.addItem(oItem);
                    });
                })
                .catch(function (e) { console.warn("[HIST PAGE]", e); });
        },

        onHistLotSelect: function (oEvent) {
            // selectionChange → "listItem", itemPress → "listItem"
            var oItem = oEvent.getParameter("listItem");
            if (!oItem) { return; }
            var sPrueflos = oItem.data("prueflos");
            if (!sPrueflos) { return; }

            var oEmpty  = this.byId("histDetailEmpty");
            var oNoData = this.byId("histDetailNoData");
            var oScroll = this.byId("histDetailScroll");
            var oFlow   = this.byId("histDetailFlow");

            if (!oEmpty || !oNoData || !oScroll || !oFlow) {
                console.warn("[HIST DETAIL] byId 실패", {
                    oEmpty: oEmpty, oNoData: oNoData, oScroll: oScroll, oFlow: oFlow
                });
                return;
            }

            // 모두 숨기고 로딩 표시
            oEmpty.setVisible(false);
            oNoData.setVisible(false);
            oScroll.setVisible(true);
            if (oFlow.removeAllItems) { oFlow.removeAllItems(); }
            oFlow.addItem(new MText({ text: "이동이력 조회 중..." }).addStyleClass("zHistLoading"));

            console.log("[QI HIST PAGE FILTER] Prueflos=", sPrueflos);

            var oModel = this.getOwnerComponent().getModel();
            var HIST_SELECT_WITH_PRUEFLOS = HIST_SELECT + ",Prueflos";
            oModel.bindList("/QualityMoveHist", null, null, [
                new Filter("Prueflos", FilterOperator.EQ, sPrueflos)
            ], { $select: HIST_SELECT_WITH_PRUEFLOS }).requestContexts(0, 200)
                .then(function (aCtx) {
                    if (oFlow.removeAllItems) { oFlow.removeAllItems(); }
                    if (!aCtx.length) {
                        oScroll.setVisible(false);
                        oNoData.setVisible(true);
                        return;
                    }
                    aCtx.forEach(function (c) {
                        var d         = c.getObject();
                        var sBwartCss = (d.Bwart === "321") ? "zPassQtyText" : "zHoldQtyText";
                        var oCard2 = new MVBox({ renderType: "Bare" }).addStyleClass("zHistCard");
                        var oTop2  = new MHBox({ renderType: "Bare" }).addStyleClass("zHistTop");
                        oTop2.addItem(new MText({ text: safe(d.Bwart) }).addStyleClass("zHistBwart " + sBwartCss));
                        oTop2.addItem(new MText({ text: safe(d.Mblnr) + "/" + safe(d.Zeile) + " (" + safe(d.Mjahr) + ")" }).addStyleClass("zHistDoc"));
                        oTop2.addItem(new MText({ text: _fmtDate(d.Budat) }).addStyleClass("zHistDate"));
                        oCard2.addItem(oTop2);
                        oCard2.addItem(new MText({
                            text: safe(d.Lgort) + " → " + safe(d.Umlgo) + "  |  " + _fmtQty(d.Menge) + " " + safe(d.Meins)
                        }).addStyleClass("zHistMid"));
                        oCard2.addItem(new MText({ text: safe(d.Sgtxt) + " / " + safe(d.Usnam) }).addStyleClass("zHistBot"));
                        oFlow.addItem(oCard2);
                    });
                })
                .catch(function (e) {
                    console.warn("[HIST DETAIL]", e);
                    if (oFlow.removeAllItems) { oFlow.removeAllItems(); }
                    oScroll.setVisible(false);
                    oNoData.setVisible(true);
                });
        }

    });
});
