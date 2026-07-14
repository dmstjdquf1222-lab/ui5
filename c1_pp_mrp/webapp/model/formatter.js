sap.ui.define([], function () {
  "use strict";

  var fnIsPrCreated = function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
    var sType = String(sMaterialType || "").toUpperCase();
    var fShortQty = Number(String(vShortQty || 0).replace(/,/g, ""));
    var bHasPrNo = !!String(sPrNo || "").trim();
    var sPrCreateYn = String(vPrCreateYn || "").trim().toUpperCase();
    var bPrCreateYn = vPrCreateYn === true || vPrCreateYn === 1 ||
      sPrCreateYn === "TRUE" || sPrCreateYn === "X" || sPrCreateYn === "Y" || sPrCreateYn === "1";

    if (sType === "FERT" || sType === "HALB") {
      return false;
    }
    if ((!bHasPrNo && !bPrCreateYn) || Number.isNaN(fShortQty)) {
      return false;
    }

    return fShortQty > 0;
  };

  return {
    runState: function (vStatus) {
      return vStatus === true || vStatus === "X" ? "Success" : "None";
    },

    coverageState: function (sState, fShortQty) {
      if (sState) { return sState; }
      return Number(fShortQty || 0) > 0 ? "Error" : "Success";
    },

    prText: function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
      return fnIsPrCreated(vPrCreateYn, sPrNo, vShortQty, sMaterialType) ? "PR 생성" : "미대상";
    },

    prState: function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
      return fnIsPrCreated(vPrCreateYn, sPrNo, vShortQty, sMaterialType) ? "Success" : "None";
    },

    _isPrCreated: function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
      return fnIsPrCreated(vPrCreateYn, sPrNo, vShortQty, sMaterialType);
    },

    prTargetText: function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
      if (fnIsPrCreated(vPrCreateYn, sPrNo, vShortQty, sMaterialType)) { return "PR 생성"; }
      return "미대상";
    },

    prTargetState: function (vPrCreateYn, sPrNo, vShortQty, sMaterialType) {
      if (fnIsPrCreated(vPrCreateYn, sPrNo, vShortQty, sMaterialType)) { return "Success"; }
      return "None";
    },

    number: function (vValue) {
      if (vValue === null || vValue === undefined || vValue === "") { return ""; }
      var fValue = Number(String(vValue).replace(/,/g, ""));
      if (Number.isNaN(fValue)) { return String(vValue); }
      return fValue.toLocaleString("ko-KR", { maximumFractionDigits: 3 });
    },

    quantity: function (vValue, sUnit) {
      if (vValue === null || vValue === undefined || vValue === "") { return ""; }

      var fValue = Number(String(vValue).replace(/,/g, ""));
      if (Number.isNaN(fValue)) { return String(vValue); }

      var bIntegerUnit = String(sUnit || "").toUpperCase() === "EA";
      return fValue.toLocaleString("ko-KR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: bIntegerUnit ? 0 : 3
      });
    },

    coverageSummaryHtml: function (vRequiredQty, vShortQty) {
      var fRequiredQty = Number(String(vRequiredQty || 0).replace(/,/g, ""));
      var fShortQty = Number(String(vShortQty || 0).replace(/,/g, ""));
      var fCoveredQty = Math.max(fRequiredQty - fShortQty, 0);
      var fCoveredPercent = fRequiredQty > 0 ? Math.min((fCoveredQty / fRequiredQty) * 100, 100) : 0;
      var fShortPercent = fRequiredQty > 0 ? Math.min((fShortQty / fRequiredQty) * 100, 100) : 0;
      var sCoveredWidth = Math.max(fCoveredPercent, fCoveredQty > 0 ? 4 : 0).toFixed(2);
      var sShortWidth = Math.max(fShortPercent, fShortQty > 0 ? 4 : 0).toFixed(2);
      var fnText = function (fValue) {
        return Number(fValue || 0).toLocaleString("ko-KR", { maximumFractionDigits: 3 });
      };

      return [
        "<div class='mrpCoverageSummary'>",
        "<div class='mrpCoverageBar' title='커버 ", fnText(fCoveredQty), " / 부족 ", fnText(fShortQty), "'>",
        "<div class='mrpCoverageCovered' style='width:", sCoveredWidth, "%'></div>",
        "<div class='mrpCoverageShort' style='width:", sShortWidth, "%'></div>",
        "</div>",
        "<div class='mrpCoverageCaption'>",
        "<span>", Math.round(fCoveredPercent), "%</span>",
        "<span>", fShortQty > 0 ? "부족 " + fnText(fShortQty) : "정상", "</span>",
        "</div>",
        "</div>"
      ].join("");
    }
  };
});
