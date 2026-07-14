sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * WorkStatus → 한글 텍스트
         * PENDING(판정대기) / PASS(합격) / PARTIAL(부분합격) / FAIL(불합격·보류)
         * HOLD 는 구버전 호환용 fallback
         */
        workStatusText: function (sStatus) {
            const map = {
                PENDING: "판정대기",
                PASS:    "합격",
                PARTIAL: "부분합격",
                FAIL:    "불합격/보류",
                HOLD:    "불합격/보류"
            };
            return map[sStatus] || sStatus || "—";
        },

        /**
         * WorkStatus → sap.ui.core.ValueState
         */
        workStatusState: function (sStatus) {
            const map = {
                PENDING: "None",
                PASS:    "Success",
                PARTIAL: "Warning",
                FAIL:    "Error",
                HOLD:    "Error"
            };
            return map[sStatus] || "None";
        },

        /**
         * ZfinalUd 코드 → 텍스트
         * 신규 기준: A=합격, P=부분합격, R=불합격/보류
         */
        finalUdText: function (sUd) {
            const map = {
                "A": "A — 합격",
                "P": "P — 부분합격",
                "R": "R — 불합격/보류"
            };
            return sUd ? (map[sUd] || sUd) : "미판정";
        },

        /**
         * ZfinalUd → ValueState
         */
        finalUdState: function (sUd) {
            if (!sUd) return "None";
            if (sUd === "A") return "Success";
            if (sUd === "P") return "Warning";
            if (sUd === "R") return "Error";
            return "None";
        },

        /**
         * QualityResult.ZcheckVal → ValueState
         * 실제 SAP QM 특성판정 코드는 ABAP 커스터마이징 확인 필요
         * 일반적으로: A=합격, R=불합격 계열
         */
        checkValState: function (sVal) {
            if (!sVal) return "None";
            if (sVal === "A") return "Success";
            if (sVal === "R") return "Error";
            return "Warning";
        },

        checkValText: function (sVal) {
            if (!sVal) return "—";
            if (sVal === "A") return "합격";
            if (sVal === "R") return "불합격";
            return sVal;
        },

        /**
         * 이동유형 Bwart → ValueState
         */
        bwartState: function (sBwart) {
            if (sBwart === "101") return "Information";
            if (sBwart === "321") return "Success";
            if (sBwart === "322") return "Warning";
            return "None";
        },

        /**
         * 수량 + 단위 표시
         */
        qtyText: function (qty, unit) {
            if (qty === null || qty === undefined) return "—";
            return parseFloat(qty).toLocaleString("ko-KR") + " " + (unit || "");
        },

        /**
         * 공차 범위 (하한 ~ 상한)
         */
        tolRange: function (low, up) {
            if (!low && !up) return "—";
            return (low || "—") + " ~ " + (up || "—");
        },

        /**
         * Date 타입 포맷 (YYYY-MM-DD)
         */
        dateText: function (oDate) {
            if (!oDate) return "—";
            if (typeof oDate === "string") return oDate;
            return oDate.toISOString ? oDate.toISOString().slice(0, 10) : String(oDate);
        },

        /**
         * MoveType 코드 → 한글 설명
         */
        moveTypeText: function (sMoveType) {
            const map = {
                "GR_QI":               "GR → QI 입고 (101)",
                "QI_TO_UNRESTRICTED":  "QI → 가용재고 (321)",
                "QI_TO_BLOCKED":       "QI → 보류재고 (322)"
            };
            return map[sMoveType] || sMoveType || "—";
        },

        /**
         * OperationControl.ConfirmUsageDecision → button enabled
         */
        confirmActionEnabled: function (bEnabled, sWorkStatus) {
            if (!bEnabled) return false;
            if (sWorkStatus === "PENDING") return true;
            return false;
        }
    };
});
