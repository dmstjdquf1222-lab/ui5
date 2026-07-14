sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/ui/export/Spreadsheet",
  "sap/m/MessageToast",
  "c1/pp/c1ppmrp/model/formatter"
], function (Controller, Filter, FilterOperator, Sorter, Spreadsheet, MessageToast, formatter) {
  "use strict";

  return Controller.extend("c1.pp.c1ppmrp.controller.c1_pp_mrp", {
    formatter: formatter,

    // 화면 최초 실행 상태
    // - MRP 실행 목록 탭과 부족 자재 결과 탭은 각각 별도 상태값으로 관리한다.
    // - 실행 ID 정렬 방향도 컨트롤러 변수로 들고 있어 버튼을 누를 때마다 오름/내림을 전환한다.
    // - 이 값들은 백엔드 저장값이 아니라 화면 제어용 상태라 view 모델보다 단순한 private 변수로 둔다.
    onInit: function () {
      this._sResultTabKey = "ALL";
      this._sRunTabKey = "ALL";
      this._bRunSortDescending = false;
    },

    // 렌더링 이후 테이블 바인딩 후처리
    // - sap.ui.table.Table의 rows 바인딩은 화면이 그려진 뒤 접근 가능하다.
    // - 실행 목록/결과 목록 바인딩에 change 이벤트를 붙여 데이터가 바뀔 때 KPI와 차트를 같이 갱신한다.
    // - _bBindingsAttached로 한 번만 연결해서 화면 재렌더링 때 이벤트가 중복 등록되지 않게 막는다.
    onAfterRendering: function () {
      if (this._bBindingsAttached) { return; }

      var oRunBinding = this.byId("mrpRunTable").getBinding("rows");
      var oResultBinding = this.byId("mrpResultTable").getBinding("rows");

      if (oRunBinding) { oRunBinding.attachChange(this._updateDashboard, this); }
      if (oResultBinding) { oResultBinding.attachChange(this._updateDashboard, this); }

      this._bBindingsAttached = true;
      this._configureCharts();
      this._updateDashboard();
    },

    // 조회 버튼 처리
    // - 상단 조건을 MRP 실행 목록과 MRP 결과 목록 양쪽에 동시에 적용한다.
    // - 목록 필터 후 KPI/차트도 다시 계산해서 화면 숫자와 테이블 내용이 어긋나지 않게 한다.
    onSearch: function () {
      this._filterRuns();
      this._filterResults();
      this._updateDashboard();
      MessageToast.show("MRP 결과를 조회했습니다.");
    },

    // 검색 조건과 선택된 상세 데이터를 최초 상태로 되돌린다.
    onResetFilter: function () {
      this.byId("werksInput").setValue("TS00");
      this.byId("mrpRunInput").setValue("");
      this.byId("materialInput").setValue("");
      this.byId("mrpRunTable").getBinding("rows").filter([]);
      this.byId("mrpResultTable").getBinding("rows").filter(this._getResultTabFilters());
      this.byId("mrpRunTable").clearSelection();
      this.byId("mrpResultTable").clearSelection();
      this.getOwnerComponent().getModel("view").setProperty("/detail", {});
      this.getOwnerComponent().getModel("view").setProperty("/coverage", {});
      this._updateDashboard();
    },

    // 현재 검색 조건을 유지한 채 OData 데이터를 다시 읽는다.
    onRefresh: function () {
      this._filterRuns();
      this._filterResults();
      this.byId("mrpRunTable").getBinding("rows").refresh();
      this.byId("mrpResultTable").getBinding("rows").refresh();
      this._updateDashboard();
    },

    // MRP 실행 상태 탭을 선택한다.
    onRunTabSelect: function (oEvent) {
      this._sRunTabKey = oEvent.getParameter("key");
      this._filterRuns();
    },

    // 부족 및 PR 생성 탭을 선택한다.
    onResultTabSelect: function (oEvent) {
      this._sResultTabKey = oEvent.getParameter("key");
      this._filterResults();
    },

    // MRP 실행 행 선택 처리
    // - 왼쪽 실행 목록에서 특정 실행 ID를 선택하면 해당 ID를 검색조건에 자동으로 넣는다.
    // - 이후 부족 자재 결과 테이블은 선택한 MrpRunId 기준으로 좁혀진다.
    // - 이전에 선택되어 있던 자재 상세/커버리지 정보는 다른 실행의 데이터와 섞이지 않도록 초기화한다.
    onRunSelectionChange: function (oEvent) {
      var oTable = oEvent.getSource();
      var iIndex = oTable.getSelectedIndex();
      if (iIndex < 0) { return; }

      var oContext = oTable.getContextByIndex(iIndex);
      if (!oContext) { return; }

      var sMrpRunId = oContext.getProperty("MrpRunId");
      this.byId("mrpRunInput").setValue(sMrpRunId);
      this.byId("mrpResultTable").clearSelection();
      this.getOwnerComponent().getModel("view").setProperty("/selectedRunId", sMrpRunId);
      this.getOwnerComponent().getModel("view").setProperty("/detail", {});
      this.getOwnerComponent().getModel("view").setProperty("/coverage", {});
      this._filterResults();
    },

    // 부족 자재 결과 행 선택 처리
    // - 선택한 자재의 소요수량, 부족수량을 기준으로 커버수량과 커버율을 계산한다.
    // - 계산 결과는 view>/detail, view>/coverage에 나눠 저장해서 상세 영역과 미니 막대가 같이 사용한다.
    // - 커버수량 = 소요수량 - 부족수량이며, 음수가 나오지 않도록 0으로 보정한다.
    onResultSelectionChange: function (oEvent) {
      var oTable = oEvent.getSource();
      var iIndex = oEvent.getParameter("rowIndex");

      if (iIndex === undefined || iIndex < 0) {
        iIndex = oTable.getSelectedIndex();
      }
      if (iIndex < 0) { return; }

      var oContext = oTable.getContextByIndex(iIndex);
      if (!oContext) { return; }

      var fRequiredQty = Number(oContext.getProperty("RequiredQty") || 0);
      var fShortQty = Number(oContext.getProperty("ShortQty") || 0);
      var fCoveredQty = Math.max(fRequiredQty - fShortQty, 0);
      var fCoveredPercent = fRequiredQty > 0 ? Math.min((fCoveredQty / fRequiredQty) * 100, 100) : 0;
      var fShortPercent = fRequiredQty > 0 ? Math.min((fShortQty / fRequiredQty) * 100, 100) : 0;

      this.getOwnerComponent().getModel("view").setProperty("/detail", {
        MrpRunId: oContext.getProperty("MrpRunId"),
        MrpItemNo: oContext.getProperty("MrpItemNo"),
        PlanId: oContext.getProperty("PlanId"),
        PlanItemNo: oContext.getProperty("PlanItemNo"),
        Material: oContext.getProperty("Material"),
        MaterialText: oContext.getProperty("MaterialText"),
        MaterialType: oContext.getProperty("MaterialType"),
        RequiredQty: oContext.getProperty("RequiredQty"),
        StockQty: oContext.getProperty("StockQty"),
        ShortQty: oContext.getProperty("ShortQty"),
        BaseUnit: oContext.getProperty("BaseUnit"),
        OrderNo: oContext.getProperty("OrderNo"),
        PrCreateYn: oContext.getProperty("PrCreateYn"),
        PrNo: oContext.getProperty("PrNo"),
        CoverageStatusText: oContext.getProperty("CoverageStatusText"),
        CoverageState: oContext.getProperty("CoverageState")
      });
      this.getOwnerComponent().getModel("view").setProperty("/coverage", {
        CoveredQty: fCoveredQty,
        CoveredPercent: fCoveredPercent,
        CoveredPercentText: Math.round(fCoveredPercent),
        ShortPercent: fShortPercent,
        Html: this._buildMiniCoverageHtml(fCoveredQty, fShortQty, fCoveredPercent, fShortPercent)
      });
    },

    onTableViewPress: function () {
      this._scrollToControl("resultPanel");
    },

    onDetailPress: function () {
      this._scrollToControl("detailBox");
    },

    // Excel 다운로드
    // - 현재 테이블 바인딩에 걸린 필터 결과를 기준으로 최대 1000건까지 내려받는다.
    // - 숫자 컬럼은 문자열 그대로 내보내지 않고 Number로 변환해서 엑셀에서 합계/계산이 가능하게 한다.
    // - sap.ui.export.Spreadsheet는 빌드 후 브라우저에서 xlsx 파일을 직접 생성한다.
    onExport: function () {
      var oBinding = this.byId("mrpResultTable").getBinding("rows");
      var aData = oBinding.getContexts(0, Math.min(oBinding.getLength(), 1000)).map(function (oContext) {
        var oRow = Object.assign({}, oContext.getObject());
        oRow.RequiredQty = Number(oRow.RequiredQty || 0);
        oRow.StockQty = Number(oRow.StockQty || 0);
        oRow.ShortQty = Number(oRow.ShortQty || 0);
        return oRow;
      });

      if (!aData.length) {
        MessageToast.show("내보낼 조회 결과가 없습니다.");
        return;
      }
      var oSheet = new Spreadsheet({
        workbook: {
          columns: [
            { label: "MRP 실행 ID", property: "MrpRunId" },
            { label: "Item", property: "MrpItemNo" },
            { label: "자재", property: "Material" },
            { label: "자재명", property: "MaterialText" },
            { label: "소요수량", property: "RequiredQty", type: "number" },
            { label: "가용재고", property: "StockQty", type: "number" },
            { label: "부족수량", property: "ShortQty", type: "number" },
            { label: "단위", property: "BaseUnit" },
            { label: "PR 번호", property: "PrNo" },
            { label: "생산오더", property: "OrderNo" },
            { label: "계획 ID", property: "PlanId" }
          ]
        },
        dataSource: aData,
        fileName: "MRP_Result.xlsx"
      });

      oSheet.build().finally(function () {
        oSheet.destroy();
      });
    },

    // MRP 실행 ID를 오름차순 또는 내림차순으로 정렬한다.
    onSortRuns: function () {
      this._bRunSortDescending = !this._bRunSortDescending;
      this.byId("mrpRunTable").getBinding("rows").sort(
        new Sorter("MrpRunId", this._bRunSortDescending)
      );
    },

    // MRP 실행 목록 필터 생성/적용
    // - 플랜트와 실행 ID는 정확히 일치해야 하므로 EQ 조건을 사용한다.
    // - 탭이 확정/미확정으로 바뀌면 MrpStatus Boolean 조건을 추가한다.
    _filterRuns: function () {
      var aFilters = [];
      var sWerks = this.byId("werksInput").getValue();
      var sMrpRunId = this.byId("mrpRunInput").getValue();

      if (sWerks) { aFilters.push(new Filter("Werks", FilterOperator.EQ, sWerks)); }
      if (sMrpRunId) { aFilters.push(new Filter("MrpRunId", FilterOperator.EQ, sMrpRunId)); }
      if (this._sRunTabKey === "CONFIRMED") { aFilters.push(new Filter("MrpStatus", FilterOperator.EQ, true)); }
      if (this._sRunTabKey === "OPEN") { aFilters.push(new Filter("MrpStatus", FilterOperator.EQ, false)); }

      this.byId("mrpRunTable").getBinding("rows").filter(aFilters);
    },

    // MRP 결과 목록 필터 생성/적용
    // - 기본 검색조건(MrpRunId, Material)과 결과 탭 조건(PR 생성, 부족)을 합쳐서 적용한다.
    // - 테이블 표시 필터와 KPI/차트용 $filter 문자열 생성 로직이 따로 있으므로, 조건을 바꿀 때 둘 다 같이 봐야 한다.
    _filterResults: function () {
      var aFilters = this._getResultTabFilters().concat(this._getBaseResultFilters());

      this.byId("mrpResultTable").getBinding("rows").filter(aFilters);
    },

    _getBaseResultFilters: function () {
      var aFilters = [];
      var sMrpRunId = this.byId("mrpRunInput").getValue();
      var sMaterial = this.byId("materialInput").getValue();

      if (sMrpRunId) { aFilters.push(new Filter("MrpRunId", FilterOperator.EQ, sMrpRunId)); }
      if (sMaterial) { aFilters.push(new Filter("Material", FilterOperator.Contains, sMaterial)); }

      return aFilters;
    },

    _getResultTabFilters: function () {
      if (this._sResultTabKey === "PR_TARGET") {
        return [
          new Filter("PrCreateYn", FilterOperator.EQ, true),
          new Filter("CoverageState", FilterOperator.EQ, "Error"),
          new Filter("MaterialType", FilterOperator.NE, "FERT"),
          new Filter("MaterialType", FilterOperator.NE, "HALB")
        ];
      }
      if (this._sResultTabKey === "SHORTAGE") { return [new Filter("CoverageState", FilterOperator.EQ, "Error")]; }
      return [];
    },

    // KPI 갱신 시작점
    // - 실행 목록 건수는 현재 rows 바인딩 길이에서 바로 읽는다.
    // - 결과 목록 KPI는 전체/부족/PR대상/커버완료를 각각 $count로 다시 요청해야 하므로 _scheduleResultCounts로 지연 실행한다.
    _updateKpis: function () {
      var oRunBinding = this.byId("mrpRunTable").getBinding("rows");
      var oResultBinding = this.byId("mrpResultTable").getBinding("rows");
      var oViewModel = this.getOwnerComponent().getModel("view");

      if (oRunBinding) { oViewModel.setProperty("/totalRuns", oRunBinding.getLength()); }
      this._scheduleResultCounts();
    },

    _updateDashboard: function () {
      this._updateKpis();
      this._scheduleCharts();
    },

    // 차트 데이터 조회
    // - 차트는 테이블 바인딩 데이터가 아니라 같은 조건의 OData URL을 직접 fetch해서 만든다.
    // - RequiredQty와 ShortQty를 자재별로 합산하고, 부족수량이 큰 자재 상위 12개만 보여준다.
    // - 요청 번호(_iChartRequestId)를 비교해서 늦게 도착한 이전 요청이 최신 차트를 덮어쓰지 못하게 한다.
    _updateCharts: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oChartModel = this.getOwnerComponent().getModel("charts");
      var sFilter = this._getResultFilterExpression();
      var sUrl = this._getAbsoluteServiceUrl(oModel) + "MrpResults?$select=Material,RequiredQty,ShortQty";
      var iRequestId = (this._iChartRequestId || 0) + 1;

      this._iChartRequestId = iRequestId;

      if (!oChartModel) { return; }

      if (sFilter) {
        sUrl += "&$filter=" + encodeURIComponent(sFilter);
      }
      sUrl += "&$top=1000";

      fetch(sUrl).then(function (oResponse) {
        if (!oResponse.ok) { throw new Error("Chart request failed"); }
        return oResponse.json();
      }).then(function (oData) {
        if (iRequestId !== this._iChartRequestId) { return; }

        var mMaterials = {};

        (oData.value || []).forEach(function (oRow) {
          var sMaterial = oRow.Material || "-";
          var fRequiredQty = Number(oRow.RequiredQty || 0);
          var fShortQty = Number(oRow.ShortQty || 0);

          if (!mMaterials[sMaterial]) {
            mMaterials[sMaterial] = {
              Material: sMaterial,
              CoveredQty: 0,
              ShortQty: 0
            };
          }
          mMaterials[sMaterial].CoveredQty += Math.max(fRequiredQty - fShortQty, 0);
          mMaterials[sMaterial].ShortQty += fShortQty;
        });

        var aMaterialCoverage = Object.keys(mMaterials).map(function (sMaterial) {
          return mMaterials[sMaterial];
        }).sort(function (a, b) {
          return b.ShortQty - a.ShortQty;
        }).slice(0, 12).reverse();

        oChartModel.setProperty("/materialCoverage", aMaterialCoverage);
      }.bind(this)).catch(function () {
        if (iRequestId === this._iChartRequestId) {
          oChartModel.setProperty("/materialCoverage", []);
        }
      }.bind(this));
    },

    _scheduleResultCounts: function () {
      clearTimeout(this._iResultCountTimer);
      this._iResultCountTimer = setTimeout(this._refreshResultCounts.bind(this), 250);
    },

    _scheduleCharts: function () {
      clearTimeout(this._iChartTimer);
      this._iChartTimer = setTimeout(this._updateCharts.bind(this), 250);
    },

    _refreshResultCounts: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oViewModel = this.getOwnerComponent().getModel("view");
      var sBaseFilter = this._getBaseResultFilterExpression();
      var sServiceUrl = this._getAbsoluteServiceUrl(oModel);

      var fnRequestCount = function (sStatusFilter) {
        var sFilter = [sBaseFilter, sStatusFilter].filter(Boolean).join(" and ");
        var sUrl = sServiceUrl + "MrpResults/$count";

        if (sFilter) {
          sUrl += "?$filter=" + encodeURIComponent(sFilter);
        }

        return fetch(sUrl).then(function (oResponse) {
          if (!oResponse.ok) { throw new Error("Count request failed"); }
          return oResponse.text();
        }).then(Number);
      };

      Promise.all([
        fnRequestCount(""),
        fnRequestCount("CoverageState eq 'Error'"),
        fnRequestCount(this._getPrCreatedFilterExpression()),
        fnRequestCount("CoverageState eq 'Success'")
      ]).then(function (aCounts) {
        oViewModel.setProperty("/totalResultItems", aCounts[0]);
        oViewModel.setProperty("/shortageItems", aCounts[1]);
        oViewModel.setProperty("/criticalItems", aCounts[2]);
        oViewModel.setProperty("/coveredItems", aCounts[3]);
      });
    },

    // fetch 기반 $count/$chart 요청에 사용할 OData $filter 문자열 생성
    // - UI5 Filter 객체는 bindList에는 바로 쓸 수 있지만 fetch URL에는 문자열이 필요하다.
    // - 사용자가 작은따옴표를 입력해도 OData 문법이 깨지지 않도록 ''로 escape한다.
    _getBaseResultFilterExpression: function () {
      var aExpressions = [];
      var sMrpRunId = this.byId("mrpRunInput").getValue();
      var sMaterial = this.byId("materialInput").getValue();
      var fnEscape = function (sValue) {
        return String(sValue).replace(/'/g, "''");
      };

      if (sMrpRunId) { aExpressions.push("MrpRunId eq '" + fnEscape(sMrpRunId) + "'"); }
      if (sMaterial) { aExpressions.push("contains(Material,'" + fnEscape(sMaterial) + "')"); }

      return aExpressions.join(" and ");
    },

    _getAbsoluteServiceUrl: function (oModel) {
      var sServiceUrl = oModel.getServiceUrl();
      var sAbsoluteUrl = new URL(sServiceUrl, window.location.origin + "/").href;

      return sAbsoluteUrl.endsWith("/") ? sAbsoluteUrl : sAbsoluteUrl + "/";
    },

    _getResultFilterExpression: function () {
      var aExpressions = [
        this._getBaseResultFilterExpression(),
        this._getResultTabFilterExpression()
      ].filter(Boolean);

      return aExpressions.join(" and ");
    },

    _getResultTabFilterExpression: function () {
      if (this._sResultTabKey === "PR_TARGET") { return this._getPrCreatedFilterExpression(); }
      if (this._sResultTabKey === "SHORTAGE") { return "CoverageState eq 'Error'"; }
      return "";
    },

    _getPrCreatedFilterExpression: function () {
      return "PrCreateYn eq true and CoverageState eq 'Error' and MaterialType ne 'FERT' and MaterialType ne 'HALB'";
    },

    // 선택 자재 커버리지 미니 막대 HTML 생성
    // - core:HTML에 넣을 작은 막대 UI를 문자열로 만든다.
    // - 커버수량과 부족수량이 아주 작아도 눈에 보이도록 최소 폭 4%를 보정한다.
    // - 실제 수치는 title과 하단 값 영역에 같이 표시한다.
    _buildMiniCoverageHtml: function (fCoveredQty, fShortQty, fCoveredPercent, fShortPercent) {
      var fnText = function (fValue) {
        return Number(fValue || 0).toLocaleString("ko-KR", { maximumFractionDigits: 3 });
      };
      var sCoveredWidth = Math.max(fCoveredPercent, fCoveredQty > 0 ? 4 : 0).toFixed(2);
      var sShortWidth = Math.max(fShortPercent, fShortQty > 0 ? 4 : 0).toFixed(2);

      return [
        "<div class='mrpMiniBarShell'>",
        "<div class='mrpMiniBar'>",
        "<div class='mrpMiniBarCovered' title='커버수량 ", fnText(fCoveredQty), "' style='width:", sCoveredWidth, "%'></div>",
        "<div class='mrpMiniBarShort' title='부족수량 ", fnText(fShortQty), "' style='width:", sShortWidth, "%'></div>",
        "</div>",
        "<div class='mrpMiniValues'>",
        "<div><span><i class='mrpMiniLegendCovered'></i>커버수량</span><strong>", fnText(fCoveredQty), "</strong></div>",
        "<div><span><i class='mrpMiniLegendShort'></i>부족수량</span><strong>", fnText(fShortQty), "</strong></div>",
        "</div>",
        "</div>"
      ].join("");
    },

    _configureCharts: function () {
      var oChart = this.byId("coverageChart");

      if (!oChart) { return; }
      oChart.setVizProperties({
        title: { visible: false },
        legend: { visible: true, position: "bottom" },
        plotArea: {
          dataLabel: { visible: true },
          colorPalette: ["#30914c", "#d20a0a"]
        },
        valueAxis: { title: { visible: false } },
        categoryAxis: { title: { visible: false } }
      });
    },

    // 화면 내부 스크롤 이동
    // - 테이블/상세 버튼을 누르면 DynamicPage 내부 스크롤 컨테이너 기준으로 위치를 계산한다.
    // - 브라우저 window가 아니라 sapFDynamicPageContentWrapper를 직접 움직여야 UI5 페이지 안에서 정확히 이동한다.
    _scrollToControl: function (sControlId) {
      var oTarget = this.byId(sControlId);
      var oDynamicPage = this.byId("dynamicPage");
      var oTargetDom = oTarget && oTarget.getDomRef();
      var oPageDom = oDynamicPage && oDynamicPage.getDomRef();
      var oScrollContainer = oPageDom && oPageDom.querySelector(".sapFDynamicPageContentWrapper");

      if (!oTargetDom || !oScrollContainer) { return; }

      var iTargetTop = oScrollContainer.scrollTop +
        oTargetDom.getBoundingClientRect().top -
        oScrollContainer.getBoundingClientRect().top - 8;

      oScrollContainer.scrollTop = iTargetTop;
    }
  });
});

