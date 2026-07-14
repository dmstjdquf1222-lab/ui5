sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/DatePicker",
    "sap/m/CheckBox",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/core/HTML"
], (Controller, JSONModel, Filter, FilterOperator, NumberFormat, MessageBox, MessageToast, Dialog, Button, Label, Input, DatePicker, CheckBox, VBox, HBox, SelectDialog, StandardListItem, HTML) => {
    "use strict";
    
    return Controller.extend("c1.pp.c1ppperformance.controller.c1_pp_performance", {
        // 1. 화면 상태 모델: 필터, 선택행, 상세 표시 여부, KPI를 관리한다.
        // 화면 상태 모델 초기화
        // - filters는 상단 검색조건이고, _buildOperationFilters에서 OData Filter로 변환된다.
        // - selected/selectedKey는 사용자가 선택한 생산오더 공정 행과 그 식별자다.
        // - detailVisible/hasSelection은 오른쪽 상세 패널과 실적 입력 버튼 표시 여부를 제어한다.
        // - kpi는 현재 검색조건 기준의 전체/대기/진행/완료 공정 건수다.
        onInit() {
            this.getView().setModel(new JSONModel({
                hasSelection: false,
                detailVisible: false,
                selected: {},
                filters: {
                    orderNo: "",
                    weekNo: "",
                    plant: "",
                    material: "",
                    workCenter: "",
                    operation: "",
                    status: "ALL"
                },
                kpi: {
                    total: 0,
                    wait: 0,
                    run: 0,
                    done: 0
                },
                mailTargets: [],
                mailBusy: false,
                mailSelectedCount: 0
            }), "view");
        },

        // XML 바인딩은 최초 로딩 시 필터 없이 데이터를 읽을 수 있으므로,
        // 화면이 그려진 직후 REL 오더 필터를 한 번 강제로 적용한다.
        onAfterRendering() {
            if (this._bInitialRelFilterApplied) {
                return;
            }

            this._bInitialRelFilterApplied = true;
            this._applyFilters();
            this._refreshMailTargets();
        },

        // 현재 필터는 유지하고 공정 목록과 KPI를 서버에서 다시 조회한다.
        // 새로고침
        // - 현재 필터 조건은 유지하고 공정 목록 바인딩만 다시 읽는다.
        // - KPI는 별도 count 로직을 쓰므로 목록 refresh와 함께 _refreshKpiCounts를 호출한다.
        // - 저장 후 내부 갱신에서는 토스트가 거슬리지 않도록 bSilent=true로 호출한다.
        onRefresh(bSilent) {
            const bIsSilent = bSilent === true;

            this._applyFilters(true);
            this._refreshMailTargets();

            if (!bIsSilent) {
                MessageToast.show("새로고침했습니다.");
            }
        },

        // 2. 필터 F4 이벤트: 실제 팝업 생성은 _openFilterValueHelp에서 공통 처리한다.
        // 상단 필터 서치헬프 진입점
        // - 버튼별 메소드는 어떤 필드의 도움말을 열지 타입만 넘긴다.
        // - 실제 SelectDialog 생성, 후보 조회, 중복 제거는 _openFilterValueHelp에서 공통 처리한다.
        onOrderValueHelp() {
            this._openFilterValueHelp("orderNo");
        },

        onPlantValueHelp() {
            this._openFilterValueHelp("plant");
        },

        onMaterialValueHelp() {
            this._openFilterValueHelp("material");
        },

        onWorkCenterValueHelp() {
            this._openFilterValueHelp("workCenter");
        },

        onOperationValueHelp() {
            this._openFilterValueHelp("operation");
        },
        onApplyFilters() {
            this._applyFilters();
        },

        onResetFilters() {
            this.getView().getModel("view").setProperty("/filters", {
                orderNo: "",
                weekNo: "",
                plant: "",
                material: "",
                workCenter: "",
                operation: "",
                status: "ALL"
            });
            this._applyFilters();
        },

        // 3. 공정 행 선택: 선택 데이터를 view>/selected에 넣어 우측 상세를 연다.
        // 공정 행 선택
        // - 사용자가 공정 목록의 행을 누르면 해당 바인딩 컨텍스트를 view>/selected에 복사한다.
        // - 오른쪽 상세 영역은 selected 데이터를 기준으로 표시되고, 실적 입력 팝업도 이 값을 기본값으로 사용한다.
        onOperationPress(oEvent) {
            const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            this._setSelectedOperation(oItem.getBindingContext());
        },

        onOperationsUpdated(oEvent) {
            const aItems = oEvent.getSource().getItems();

            if (!this._bKpiInitialized) {
                this._bKpiInitialized = true;
                this._refreshKpiCounts();
            }

            this._refreshSelectedOperation(aItems);
        },

        onCloseDetail() {
            this.getView().getModel("view").setProperty("/detailVisible", false);
        },

        // MM 알림 대상 테이블에서 선택한 행 수를 화면 상태에 반영한다.
        onMailSelectionChange() {
            const oTable = this.byId("mailTable");
            const iSelectedCount = oTable ? oTable.getSelectedItems().length : 0;

            this.getView().getModel("view").setProperty("/mailSelectedCount", iSelectedCount);
        },

        // CNF 상태이고 아직 메일 발송 완료 처리되지 않은 생산오더를 메일 발송 대상으로 조회한다.
        // 업무 의미
        // - 공정 실적이 모두 최종 확정되면 서버에서 생산오더 상태가 CNF로 바뀐다.
        // - CNF 오더는 생산이 끝났다는 뜻이므로, MM 부서에서 완제품 입고 처리를 해야 한다.
        // - 이미 메일을 보낸 오더는 MailSent 값이 X/true로 내려오므로 화면 대상에서 제외한다.
        // 구현 포인트
        // - 일반 테이블 바인딩이 아니라 bindList + requestContexts로 직접 조회한다.
        // - Action 호출 시 엔티티 경로가 필요하므로 각 행에 __contextPath를 따로 보관한다.
        _refreshMailTargets() {
            const oViewModel = this.getView().getModel("view");
            const oModel = this.getView().getModel();
            const oBinding = oModel.bindList(
                "/ProductionOrders",
                undefined,
                undefined,
                [new Filter("ProductionStatus", FilterOperator.EQ, "CNF")],
                {
                    $select: "OrderNo,PlanId,PlanItemNo,Plant,PlantName,Material,MaterialText,BasicStartDate,BasicEndDate,ProductionStatus,ProductionStatusText,MailSent",
                    $$groupId: "$direct"
                }
            );

            oViewModel.setProperty("/mailBusy", true);
            oViewModel.setProperty("/mailSelectedCount", 0);

            return oBinding.requestContexts(0, 5000).then((aContexts) => {
                const aTargets = aContexts
                    .map((oContext) => {
                        const oData = Object.assign({}, oContext.getObject());
                        oData.__contextPath = oContext.getPath();
                        return oData;
                    })
                    .filter((oData) => !this._isMailSent(oData.MailSent));

                oViewModel.setProperty("/mailTargets", aTargets);
                oViewModel.setProperty("/mailBusy", false);
                oBinding.destroy();
            }).catch((oError) => {
                oViewModel.setProperty("/mailBusy", false);
                oBinding.destroy();
                MessageBox.error(this._getErrorMessage(oError));
            });
        },

        _isMailSent(vMailSent) {
            return vMailSent === true || vMailSent === "X" || vMailSent === "x" || vMailSent === "true";
        },

        formatMailSentText(vMailSent) {
            return this._isMailSent(vMailSent) ? "발송완료" : "미발송";
        },

        formatMailSentState(vMailSent) {
            return this._isMailSent(vMailSent) ? "Success" : "Warning";
        },

        // MM 입고 요청 메일의 첨부 문서를 실제 발송 전에 HTML로 미리 보여준다.
        // - 메일 발송 대상 테이블에서 선택한 생산오더만 대상으로 한다.
        // - 헤더 정보는 mailTargets에 이미 있으나, 양품/불량/완료일은 공정 실적 합산이 필요하므로
        //   _requestMailPreviewOperations에서 공정 데이터를 추가로 조회한다.
        // - 미리보기 HTML은 메일 본문/첨부와 동일한 양식으로 구성되어 사용자가 발송 전 검토할 수 있다.
        onPreviewMmMail() {
            const oTable = this.byId("mailTable");
            const aItems = oTable ? oTable.getSelectedItems() : [];

            if (!aItems.length) {
                MessageToast.show("첨부 미리보기할 생산오더를 선택하세요.");
                return;
            }

            const oViewModel = this.getView().getModel("view");
            const aOrders = aItems.map((oItem) => Object.assign({}, oItem.getBindingContext("view").getObject()));

            oViewModel.setProperty("/mailBusy", true);

            this._requestMailPreviewOperations(aOrders).then((mOperationsByOrder) => {
                const sHtml = this._buildMailPreviewHtml(aOrders, mOperationsByOrder);

                oViewModel.setProperty("/mailBusy", false);
                this._openMailPreviewDialog(sHtml);
            }).catch((oError) => {
                oViewModel.setProperty("/mailBusy", false);
                MessageBox.error(this._getErrorMessage(oError));
            });
        },

        // 선택된 생산오더들의 공정 실적 데이터를 한 번에 조회한다.
        // - 여러 오더를 선택할 수 있으므로 OrderNo EQ 조건을 OR로 묶는다.
        // - 결과는 { 오더번호: [공정실적...] } 형태로 그룹핑해서 미리보기 문서 생성 시 빠르게 찾는다.
        // - 조회 컬럼은 메일 요약에 필요한 수량, 단위, 최종확정 여부, 최종 전기일만 선택한다.
        _requestMailPreviewOperations(aOrders) {
            const aOrderFilters = aOrders
                .filter((oOrder) => oOrder.OrderNo)
                .map((oOrder) => new Filter("OrderNo", FilterOperator.EQ, oOrder.OrderNo));

            if (!aOrderFilters.length) {
                return Promise.resolve({});
            }

            const oBinding = this.getView().getModel().bindList(
                "/ProductionOrderOperations",
                undefined,
                undefined,
                [new Filter({ filters: aOrderFilters, and: false })],
                {
                    $select: "OrderNo,OrderItemNo,OperationNo,OperationText,OrderQty,BaseUnit,ConfirmedYieldQty,ConfirmedScrapQty,FinalFlag,LastPostingDate",
                    $$groupId: "$direct"
                }
            );

            return oBinding.requestContexts(0, 5000).then((aContexts) => {
                const mOperationsByOrder = {};

                aContexts.forEach((oContext) => {
                    const oOperation = Object.assign({}, oContext.getObject());
                    const sOrderNo = oOperation.OrderNo;

                    if (!mOperationsByOrder[sOrderNo]) {
                        mOperationsByOrder[sOrderNo] = [];
                    }

                    mOperationsByOrder[sOrderNo].push(oOperation);
                });

                oBinding.destroy();
                return mOperationsByOrder;
            }).catch((oError) => {
                oBinding.destroy();
                throw oError;
            });
        },

        // 생성된 HTML 미리보기를 UI5 Dialog에 표시한다.
        // - HTML 컨트롤을 사용하므로 sanitizeContent=false가 필요하다.
        // - 이 HTML은 내부에서 만든 문자열만 넣는 구조이지만, 동적 값은 _escapeHtml로 이스케이프한다.
        _openMailPreviewDialog(sHtml) {
            if (this._oMailPreviewDialog) {
                this._oMailPreviewDialog.destroy();
            }

            this._oMailPreviewDialog = new Dialog({
                title: "완제품 입고 요청서 첨부 미리보기",
                contentWidth: "72rem",
                contentHeight: "80vh",
                resizable: true,
                draggable: true,
                content: [
                    new HTML({
                        sanitizeContent: false,
                        content: sHtml
                    })
                ],
                endButton: new Button({
                    text: "닫기",
                    press: () => this._oMailPreviewDialog.close()
                }),
                afterClose: () => {
                    this._oMailPreviewDialog.destroy();
                    this._oMailPreviewDialog = null;
                }
            });

            this.getView().addDependent(this._oMailPreviewDialog);
            this._oMailPreviewDialog.open();
        },

        // 선택된 오더 수만큼 입고 요청서 HTML 문서를 이어 붙인다.
        // - 두 번째 문서부터는 page-break-before 스타일을 줘서 인쇄/저장 시 문서가 분리되게 한다.
        _buildMailPreviewHtml(aOrders, mOperationsByOrder) {
            const sDocuments = aOrders.map((oOrder, iIndex) => {
                const aOperations = mOperationsByOrder[oOrder.OrderNo] || [];
                return this._buildMailPreviewDocument(oOrder, aOperations, iIndex > 0);
            }).join("");

            return `<div class="mailPreviewRoot">${sDocuments}</div>`;
        },

        // 생산오더 1건에 대한 입고 요청서 HTML을 만든다.
        // - 화면 미리보기와 실제 메일 첨부의 모양을 맞추기 위해 인라인 스타일을 사용한다.
        // - 오더/자재/수량/완료일/저장위치/담당자 정보가 들어간다.
        // - 서버에서 내려온 값은 HTML 태그로 해석되지 않도록 출력 시 _escapeHtml을 거친다.
        _buildMailPreviewDocument(oOrder, aOperations, bPageBreak) {
            const oSummary = this._summarizeMailPreviewOrder(oOrder, aOperations);
            const sPageBreakStyle = bPageBreak ? "page-break-before: always; margin-top: 2rem;" : "";

            return `
                <section style="${sPageBreakStyle} font-family: 'Malgun Gothic', Arial, sans-serif; font-size: 12px; color: #222; padding: 24px; background: #fff;">
                    <table style="width: 100%; border-collapse: collapse; border-bottom: 3px solid #1f5f99; margin-bottom: 10px;">
                        <tr>
                            <td style="border: 0; padding: 6px;">
                                <div style="font-size: 26px; font-weight: bold; color: #1f5f99;">태산자전거 주식회사</div>
                                <div style="font-size: 11px; color: #333;">TAESAN BICYCLE CO., LTD.</div>
                            </td>
                            <td style="border: 0; padding: 6px;">
                                <div style="font-size: 28px; font-weight: bold; color: #1f5f99; text-align: right; letter-spacing: 3px;">완제품 입고 요청서</div>
                                <div style="text-align: right; color: #777; letter-spacing: 3px;">FINISHED GOODS RECEIPT REQUEST</div>
                            </td>
                        </tr>
                    </table>

                    <div style="text-align: right; line-height: 1.8; margin-top: 5px;">
                        요청일자 : <b>${oSummary.requestDate}</b><br>
                        담당자 : <b>${oSummary.managerName}</b>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">요청부서</td>
                            <td style="${this._mailPreviewCellStyle()}">생산관리팀</td>
                            <td style="${this._mailPreviewLabelStyle()}">수신부서</td>
                            <td style="${this._mailPreviewCellStyle()}">자재관리팀</td>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">생산오더번호</td>
                            <td style="${this._mailPreviewCellStyle()}" colspan="3">${this._escapeHtml(oOrder.OrderNo)}</td>
                        </tr>
                    </table>

                    <div style="${this._mailPreviewSectionStyle()}">주요 확인 정보</div>
                    <table style="width: 100%; border-collapse: collapse; border: 2px solid #1f5f99; background: #f5fbff; margin-top: 12px;">
                        <tr>
                            <th style="${this._mailPreviewHeadStyle()}">생산오더번호</th>
                            <th style="${this._mailPreviewHeadStyle()}">완제품 자재번호</th>
                            <th style="${this._mailPreviewHeadStyle()}">양품수량</th>
                            <th style="${this._mailPreviewHeadStyle()}">생산완료일자</th>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewSummaryCellStyle()}">${this._escapeHtml(oOrder.OrderNo)}</td>
                            <td style="${this._mailPreviewSummaryCellStyle()}">${this._escapeHtml(oOrder.Material)}</td>
                            <td style="${this._mailPreviewSummaryCellStyle()}">${this._formatDecimal(oSummary.goodQty)} ${this._escapeHtml(oSummary.unit)}</td>
                            <td style="${this._mailPreviewSummaryCellStyle()}">${this._escapeHtml(oSummary.completionDate)}</td>
                        </tr>
                    </table>

                    <div style="${this._mailPreviewSectionStyle()}">생산 완료 내역</div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">완제품 자재번호</td>
                            <td style="${this._mailPreviewCellStyle()}">${this._escapeHtml(oOrder.Material)}</td>
                            <td style="${this._mailPreviewLabelStyle()}">완제품명</td>
                            <td style="${this._mailPreviewCellStyle()}">${this._escapeHtml(oOrder.MaterialText)}</td>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">생산수량</td>
                            <td style="${this._mailPreviewNumberCellStyle()}">${this._formatDecimal(oSummary.productionQty)}</td>
                            <td style="${this._mailPreviewLabelStyle()}">양품수량</td>
                            <td style="${this._mailPreviewNumberCellStyle()}">${this._formatDecimal(oSummary.goodQty)}</td>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">불량수량</td>
                            <td style="${this._mailPreviewNumberCellStyle()}">${this._formatDecimal(oSummary.defectQty)}</td>
                            <td style="${this._mailPreviewLabelStyle()}">단위</td>
                            <td style="${this._mailPreviewCellStyle()}">${this._escapeHtml(oSummary.unit)}</td>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">생산완료일자</td>
                            <td style="${this._mailPreviewCellStyle()}">${this._escapeHtml(oSummary.completionDate)}</td>
                            <td style="${this._mailPreviewLabelStyle()}">입고 요청 저장위치</td>
                            <td style="${this._mailPreviewCellStyle()}">${this._escapeHtml(oSummary.requestLgort)}</td>
                        </tr>
                        <tr>
                            <td style="${this._mailPreviewLabelStyle()}">담당자</td>
                            <td style="${this._mailPreviewCellStyle()}" colspan="3">${this._escapeHtml(oSummary.managerName)}</td>
                        </tr>
                    </table>

                    <div style="${this._mailPreviewSectionStyle()}">비고</div>
                    <div style="border: 1px solid #777; background: #fffef3; padding: 14px; min-height: 70px; line-height: 1.8; margin-top: 8px;">
                        완제품 생산 완료에 따른 입고 처리를 요청드립니다.
                    </div>
                    <div style="text-align: right; margin-top: 35px; font-size: 14px;">담당자&nbsp;&nbsp;<b>${this._escapeHtml(oSummary.managerName)}</b></div>
                    <div style="margin-top: 45px; font-size: 10px; color: #666; line-height: 1.6;">
                        태산자전거 주식회사 | 서울특별시 성동구 성수이로 113 | TEL: 02-000-0000 | FAX: 02-000-0001<br>
                        본 메일은 완제품 입고 요청을 위해 태산자전거 SAP S/4HANA 시스템에서 자동 발송되었습니다.<br>
                        문서유형: FG-RECEIPT-REQUEST | 요청시각: ${oSummary.requestDate} ${oSummary.requestTime} | 요청자: ${this._escapeHtml(oSummary.managerName)}
                    </div>
                </section>
            `;
        },

        // 메일 미리보기에 들어갈 수량과 완료 정보를 공정 실적 목록에서 요약한다.
        // 계산 기준
        // - 공정번호 순서로 정렬한 뒤, 최종확정(FinalFlag='X') 공정이 있으면 그 공정을 대표 공정으로 본다.
        // - 품목(OrderItemNo)별로 가장 뒤 공정 또는 최종확정 공정의 누적 양품/불량을 사용한다.
        // - 생산수량은 품목별 계획수량 합계, 양품/불량은 품목별 대표 공정의 확정 수량 합계다.
        // - 완료일은 대표 공정의 LastPostingDate가 있으면 사용하고, 없으면 오더 기본 종료일을 사용한다.
        _summarizeMailPreviewOrder(oOrder, aOperations) {
            const oToday = new Date();
            const sRequestDate = `${oToday.getFullYear()}-${String(oToday.getMonth() + 1).padStart(2, "0")}-${String(oToday.getDate()).padStart(2, "0")}`;
            const sRequestTime = `${String(oToday.getHours()).padStart(2, "0")}:${String(oToday.getMinutes()).padStart(2, "0")}:${String(oToday.getSeconds()).padStart(2, "0")}`;

            const aSortedOperations = aOperations.slice().sort((oLeft, oRight) =>
                String(oLeft.OperationNo || "").localeCompare(String(oRight.OperationNo || ""), undefined, { numeric: true })
            );
            const aFinalOperations = aSortedOperations.filter((oOperation) => oOperation.FinalFlag === "X");
            const oLastOperation = (aFinalOperations.length ? aFinalOperations : aSortedOperations).slice(-1)[0] || {};
            const mItemSummary = {};

            aSortedOperations.forEach((oOperation) => {
                const sItemKey = oOperation.OrderItemNo || "_";

                if (!mItemSummary[sItemKey]) {
                    mItemSummary[sItemKey] = {
                        orderQty: this._toNumber(oOperation.OrderQty),
                        goodQty: 0,
                        defectQty: 0,
                        operationNo: ""
                    };
                }

                if (oOperation.FinalFlag === "X" || String(oOperation.OperationNo || "").localeCompare(String(mItemSummary[sItemKey].operationNo || ""), undefined, { numeric: true }) >= 0) {
                    mItemSummary[sItemKey].goodQty = this._toNumber(oOperation.ConfirmedYieldQty);
                    mItemSummary[sItemKey].defectQty = this._toNumber(oOperation.ConfirmedScrapQty);
                    mItemSummary[sItemKey].operationNo = oOperation.OperationNo || "";
                }
            });

            const aItemSummary = Object.values(mItemSummary);

            return {
                requestDate: sRequestDate,
                requestTime: sRequestTime,
                managerName: sap.ushell?.Container?.getUser?.().getFullName?.() || sap.ushell?.Container?.getUser?.().getId?.() || "",
                productionQty: aItemSummary.reduce((nSum, oItem) => nSum + oItem.orderQty, 0),
                goodQty: aItemSummary.reduce((nSum, oItem) => nSum + oItem.goodQty, 0),
                defectQty: aItemSummary.reduce((nSum, oItem) => nSum + oItem.defectQty, 0),
                unit: oLastOperation.BaseUnit || "EA",
                completionDate: oLastOperation.LastPostingDate || oOrder.BasicEndDate || sRequestDate,
                completedProcess: oLastOperation.OperationText || "-",
                requestLgort: "SL30"
            };
        },
        _mailPreviewLabelStyle() {
            return "border: 1px solid #555; padding: 6px; background: #f1f1f1; font-weight: bold; width: 15%;";
        },

        _mailPreviewCellStyle() {
            return "border: 1px solid #555; padding: 6px;";
        },

        _mailPreviewNumberCellStyle() {
            return `${this._mailPreviewCellStyle()} text-align: right;`;
        },

        _mailPreviewHeadStyle() {
            return "border: 1px solid #555; padding: 6px; background: #1f5f99; color: #fff; font-weight: bold; text-align: center;";
        },

        _mailPreviewSummaryCellStyle() {
            return "border: 1px solid #555; padding: 6px; text-align: center; font-size: 14px; font-weight: bold;";
        },

        _mailPreviewSectionStyle() {
            return "font-size: 15px; font-weight: bold; color: #1f5f99; margin-top: 18px;";
        },

        _escapeHtml(vValue) {
            return String(vValue ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#39;");
        },

        // 선택한 CNF 생산오더의 bound action SendMmMail을 호출해 MM 담당자에게 메일을 발송한다.
        // 선택한 CNF 생산오더에 대해 MM 알림 메일 발송을 시작한다.
        // - 실제 발송 전에 MessageBox.confirm으로 사용자 확인을 받는다.
        // - 확인 후 _sendSelectedMmMails에서 각 오더의 SendMmMail RAP Action을 호출한다.
        onSendMmMail() {
            const oTable = this.byId("mailTable");
            const aItems = oTable ? oTable.getSelectedItems() : [];

            if (!aItems.length) {
                MessageToast.show("메일을 발송할 생산오더를 선택하세요.");
                return;
            }

            MessageBox.confirm(`${aItems.length}건의 생산오더에 대해 MM 알림 메일을 발송하시겠습니까?`, {
                title: "MM 알림 메일 발송",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }

                    this._sendSelectedMmMails(aItems);
                }
            });
        },

        // 선택된 생산오더 각각에 대해 RAP Action SendMmMail을 실행한다.
        // - OData V4 Action은 엔티티 context path 뒤에 Action 이름을 붙여 bindContext로 호출한다.
        // - Promise.allSettled를 사용해 일부 성공/일부 실패 상황도 사용자에게 알려준다.
        // - 발송 성공 후에는 선택을 해제하고 _refreshMailTargets로 대상 목록을 다시 읽는다.
        _sendSelectedMmMails(aItems) {
            const oTable = this.byId("mailTable");
            const oViewModel = this.getView().getModel("view");
            const oModel = this.getView().getModel();
            const sActionName = "com.sap.gateway.srvd.zrap_c1_pp_0002_srv.v0001.SendMmMail";

            oViewModel.setProperty("/mailBusy", true);

            const aRequests = aItems.map((oItem) => {
                const oData = oItem.getBindingContext("view").getObject();
                const sContextPath = oData.__contextPath;

                if (!sContextPath) {
                    return Promise.reject(new Error(`${oData.OrderNo || "선택 오더"}의 OData 경로를 확인할 수 없습니다.`));
                }

                const oAction = oModel.bindContext(`${sContextPath}/${sActionName}(...)`, undefined, {
                    $$updateGroupId: "mailSend"
                });

                return oAction.execute("$direct");
            });

            Promise.allSettled(aRequests).then((aResults) => {
                const iSuccess = aResults.filter((oResult) => oResult.status === "fulfilled").length;
                const aFailed = aResults.filter((oResult) => oResult.status === "rejected");

                if (aFailed.length) {
                    MessageBox.warning(
                        `메일 발송 ${iSuccess}건 성공, ${aFailed.length}건 실패했습니다.\n${this._getErrorMessage(aFailed[0].reason)}`
                    );
                } else {
                    MessageToast.show(`메일 발송이 완료되었습니다. (${iSuccess}건)`);
                }

                if (oTable) {
                    oTable.removeSelections(true);
                }

                oViewModel.setProperty("/mailSelectedCount", 0);
                this._refreshMailTargets();
            }).catch((oError) => {
                oViewModel.setProperty("/mailBusy", false);
                MessageBox.error(this._getErrorMessage(oError));
            });
        },

        // 4. 선택한 생산오더 공정을 기준으로 실적 입력 팝업을 구성한다.
        // 실적 입력 팝업 열기
        // - 먼저 공정 행이 선택되어 있어야 한다. 선택 공정이 없으면 어떤 오더/공정에 실적을 넣을지 알 수 없다.
        // - 오더번호, 라우팅번호, 공정번호, 계획수량은 선택 행에서 가져와 읽기 전용으로 보여준다.
        // - 사용자는 전기일, 양품/불량 수량, 최종확정 여부만 입력한다.
        // - 기계/노무시간은 라우팅 기준시간과 입력 수량으로 화면에서 미리 계산해 보여준다.
        // 공정 실적 입력 팝업을 연다.
        // - 반드시 왼쪽 공정 목록에서 공정을 먼저 선택해야 한다.
        // - 선택 공정의 오더번호, 라우팅, 공정번호, 계획수량, 단위는 읽기 전용으로 보여준다.
        // - 사용자는 양품 수량, 불량 수량, 전기일, 최종 확정 여부만 입력한다.
        // - 양품/불량 수량이 바뀔 때마다 _recalculateCreateTimes가 표준시간 기준으로 시간을 재계산한다.
        onOpenCreateDialog() {
            const oSelected = this.getView().getModel("view").getProperty("/selected");

            if (!oSelected || !oSelected.OrderNo) {
                MessageToast.show("먼저 공정을 선택하세요.");
                return;
            }

            const oToday = new Date();
            const sToday = `${oToday.getFullYear()}-${String(oToday.getMonth() + 1).padStart(2, "0")}-${String(oToday.getDate()).padStart(2, "0")}`;

            const fnRecalculateTimes = () => this._recalculateCreateTimes();

            this._oCreateFields = {
                orderNo: new Input({ value: oSelected.OrderNo, editable: false }),
                orderItemNo: oSelected.OrderItemNo || "0010",
                routingNo: new Input({ value: oSelected.RoutingNo, editable: false }),
                operationNo: new Input({ value: oSelected.OperationNo, editable: false }),
                postingDate: new DatePicker({ value: sToday, valueFormat: "yyyy-MM-dd", displayFormat: "yyyy.MM.dd" }),
                planQty: new Input({ value: `${oSelected.OrderQty || "0"} ${oSelected.BaseUnit || "EA"}`, editable: false }),
                yieldQty: new Input({ type: "Number", value: "0", placeholder: "양품 수량", liveChange: fnRecalculateTimes, change: fnRecalculateTimes }),
                scrapQty: new Input({ type: "Number", value: "0", placeholder: "불량 수량", liveChange: fnRecalculateTimes, change: fnRecalculateTimes }),
                baseUnit: new Input({ value: oSelected.BaseUnit || "EA", editable: false }),
                machineTime: new Input({ type: "Number", value: "0", placeholder: "기계시간", editable: false }),
                laborTime: new Input({ type: "Number", value: "0", placeholder: "노무시간", editable: false }),
                timeUnit: new Input({ value: "MIN", maxLength: 3, editable: false }),
                finalFlag: new CheckBox({ text: "최종 확정" })
            };

            this._recalculateCreateTimes();

            const oDialog = new Dialog({
                title: "공정 실적 입력",
                contentWidth: "42rem",
                draggable: true,
                resizable: true,
                content: [
                    new VBox({
                        class: "sapUiSmallMargin",
                        items: [
                            this._fieldRow("생산오더", this._oCreateFields.orderNo, "공정", this._oCreateFields.operationNo),
                            this._fieldRow("라우팅", this._oCreateFields.routingNo, "계획 수량", this._oCreateFields.planQty),
                            this._fieldRow("확정일", this._oCreateFields.postingDate, "단위", this._oCreateFields.baseUnit),
                            this._fieldRow("양품 수량", this._oCreateFields.yieldQty, "불량 수량", this._oCreateFields.scrapQty),
                            this._fieldRow("기계시간", this._oCreateFields.machineTime, "노무시간", this._oCreateFields.laborTime),
                            this._fieldRow("시간 단위", this._oCreateFields.timeUnit, "", this._oCreateFields.finalFlag)
                        ]
                    })
                ],
                beginButton: new Button({ text: "저장", type: "Emphasized", icon: "sap-icon://save", press: () => this._createConfirmation(oDialog) }),
                endButton: new Button({ text: "취소", press: () => oDialog.close() }),
                afterClose: () => oDialog.destroy()
            });

            this.getView().addDependent(oDialog);
            oDialog.open();
        },


        formatQuantityInteger(vValue) {
            if (vValue === undefined || vValue === null || vValue === "") {
                return "";
            }

            const nValue = typeof vValue === "number"
                ? vValue
                : Number(String(vValue).replaceAll(",", "").trim());

            if (!this._oQuantityIntegerFormat) {
                this._oQuantityIntegerFormat = NumberFormat.getIntegerInstance({
                    groupingEnabled: true
                });
            }

            return Number.isFinite(nValue)
                ? this._oQuantityIntegerFormat.format(nValue)
                : "";
        },
        formatStatusState(sStatus) {
            if (sStatus === "DONE") {
                return "Success";
            }
            if (sStatus === "RUN") {
                return "Information";
            }
            return "Warning";
        },

        formatHighlight(sStatus) {
            if (sStatus === "DONE") {
                return "Success";
            }
            if (sStatus === "RUN") {
                return "Information";
            }
            return "Warning";
        },

        _fieldRow(sLabel1, oField1, sLabel2, oField2) {
            return new HBox({
                width: "100%",
                renderType: "Bare",
                items: [
                    new VBox({ width: "50%", class: "sapUiTinyMarginEnd sapUiTinyMarginBottom", items: [new Label({ text: sLabel1 }), oField1] }),
                    new VBox({ width: "50%", class: "sapUiTinyMarginBottom", items: [new Label({ text: sLabel2 }), oField2] })
                ]
            });
        },

        // 화면 입력값을 숫자로 변환한다.
        // - UI 표시 과정에서 천 단위 콤마가 들어간 값도 계산할 수 있도록 콤마를 제거한다.
        // - 빈 값, 잘못된 값은 0으로 처리해 수량 계산 로직이 NaN으로 깨지지 않게 한다.
        _toNumber(vValue) {
            const nValue = typeof vValue === "number"
                ? vValue
                : Number(String(vValue || "0").replaceAll(",", "").trim());

            return Number.isFinite(nValue) ? nValue : 0;
        },

        // 계산된 시간을 보기 좋은 소수 형태로 만든다.
        // - 정수면 소수점 없이 보여주고, 소수면 최대 세 자리 수준으로 반올림한다.
        _formatDecimal(vValue) {
            const nValue = this._toNumber(vValue);

            return Number.isInteger(nValue)
                ? String(nValue)
                : String(Math.round(nValue * 1000) / 1000);
        },

        // 실적 입력 수량을 기준으로 기계시간/노무시간을 자동 계산한다.
        // 계산식
        // - 입력수량 = 양품수량 + 불량수량
        // - 기계시간 = 입력수량 * 표준기계시간 / 표준기준수량
        // - 노무시간 = 입력수량 * 표준노무시간 / 표준기준수량
        // 표준값은 선택 공정의 StdMachineTime, StdLaborTime, StdBaseQty에서 가져온다.
        _recalculateCreateTimes() {
            const oFields = this._oCreateFields;

            if (!oFields) {
                return;
            }

            const oSelected = this.getView().getModel("view").getProperty("/selected") || {};
            const nYield = this._toNumber(oFields.yieldQty.getValue());
            const nScrap = this._toNumber(oFields.scrapQty.getValue());
            const nConfirmQty = nYield + nScrap;
            const nStdBaseQty = this._toNumber(oSelected.StdBaseQty || oSelected.StandardBaseQty || 1) || 1;
            const nStdMachineTime = this._toNumber(oSelected.StdMachineTime || oSelected.StandardMachineTime);
            const nStdLaborTime = this._toNumber(oSelected.StdLaborTime || oSelected.StandardLaborTime);

            oFields.machineTime.setValue(this._formatDecimal(nConfirmQty * nStdMachineTime / nStdBaseQty));
            oFields.laborTime.setValue(this._formatDecimal(nConfirmQty * nStdLaborTime / nStdBaseQty));
        },

        // 5. 입력값을 OperationConfirmations 엔티티에 RAP Create 요청으로 전송한다.
        // 실적 저장 처리
        // - 입력값을 검증한 뒤 /OperationConfirmations 엔티티에 create 요청을 보낸다.
        // - 양품+불량 누계가 계획수량을 넘지 않도록 화면에서 먼저 막는다.
        // - 최종확정은 누계 실적이 계획수량과 맞을 때만 허용해서 미완료 공정이 DONE 처리되는 것을 방지한다.
        // - 실제 저장 성공 여부는 createCompleted 이벤트와 submitBatch catch 양쪽에서 확인한다.
        // 실적 저장 버튼 처리.
        // 저장 전 검증
        // - 양품/불량 수량은 음수일 수 없다.
        // - 최종확정이 아닌 일반 저장은 양품 또는 불량 중 하나가 0보다 커야 한다.
        // - 기존 누적 실적 + 이번 입력 수량이 계획 수량을 초과하면 저장하지 않는다.
        // - 최종확정 체크 시에는 누적 실적 합계가 계획 수량과 정확히 맞아야 한다.
        // 저장 방식
        // - /OperationConfirmations ListBinding에 create payload를 넣고 performanceCreate 배치 그룹을 submit한다.
        // - createCompleted 이벤트와 submitBatch catch가 둘 다 올 수 있으므로 fnFinish에서 한 번만 마무리되게 막는다.
        _createConfirmation(oDialog) {
            const oFields = this._oCreateFields;
            const nYield = Number(oFields.yieldQty.getValue() || 0);
            const nScrap = Number(oFields.scrapQty.getValue() || 0);
            const oSelected = this.getView().getModel("view").getProperty("/selected") || {};
            const nPlan = Number(oSelected.OrderQty);
            const nCurrentYield = Number(oSelected.ConfirmedYieldQty || 0);
            const nCurrentScrap = Number(oSelected.ConfirmedScrapQty || 0);
            const nCurrentTotal = nCurrentYield + nCurrentScrap;
            const nInputTotal = nYield + nScrap;
            const bFinalFlag = oFields.finalFlag.getSelected();

            if (nYield < 0 || nScrap < 0) {
                MessageBox.warning("양품 수량과 불량 수량은 음수로 입력할 수 없습니다.");
                return;
            }

            if (nYield <= 0 && nScrap <= 0 && !bFinalFlag) {
                MessageBox.warning("양품 수량 또는 불량 수량 중 하나는 0보다 커야 합니다.");
                return;
            }

            if (!Number.isFinite(nPlan) || nPlan <= 0) {
                MessageBox.warning("계획 수량을 확인할 수 없어 실적을 저장할 수 없습니다.");
                return;
            }

            if (nCurrentTotal + nInputTotal > nPlan) {
                MessageBox.warning(
                    `계획 수량(${this.formatQuantityInteger(nPlan)})을 초과할 수 없습니다. `
                    + `기존 실적 ${this.formatQuantityInteger(nCurrentTotal)}, `
                    + `이번 입력 ${this.formatQuantityInteger(nInputTotal)}`
                );
                return;
            }

            if (bFinalFlag && Math.abs(nCurrentTotal + nInputTotal - nPlan) > 0.0005) {
                MessageBox.warning(
                    `최종확정은 누적 실적이 계획 수량(${this.formatQuantityInteger(nPlan)})과 `
                    + `일치할 때만 가능합니다. 현재 합계 ${this.formatQuantityInteger(nCurrentTotal + nInputTotal)}`
                );
                return;
            }

            const sPostingDate = (oFields.postingDate.getValue() || "").replaceAll(".", "-");

            // 서버 RAP Behavior가 처리할 실적 생성 payload.
            // ConfirmationNo는 화면에서 임시 번호를 만들어 보내지만,
            // 실제 번호 채번/검증 책임은 서버 로직에 두는 것이 안전하다.
            const oPayload = {
                ConfirmationNo: this._createTemporaryConfirmationNo(sPostingDate),
                OrderNo: oFields.orderNo.getValue(),
                OrderItemNo: oFields.orderItemNo,
                RoutingNo: oFields.routingNo.getValue(),
                OperationNo: oFields.operationNo.getValue(),
                OperationText: oSelected.OperationText || "",
                WorkCenter: oSelected.WorkCenter || "",
                Material: oSelected.Material || "",
                MaterialText: oSelected.MaterialText || "",
                PostingDate: sPostingDate,
                YieldQty: String(nYield),
                ScrapQty: String(nScrap),
                BaseUnit: oFields.baseUnit.getValue(),
                MachineTime: String(Number(oFields.machineTime.getValue() || 0)),
                LaborTime: String(Number(oFields.laborTime.getValue() || 0)),
                TimeUnit: oFields.timeUnit.getValue(),
                FinalFlag: bFinalFlag
            };

            const oModel = this.getView().getModel();
            const oListBinding = oModel.bindList("/OperationConfirmations", undefined, undefined, undefined, {
                $$updateGroupId: "performanceCreate"
            });
            let bCompleted = false;

            const fnFinish = (bSuccess, oError) => {
                if (bCompleted) {
                    return;
                }

                bCompleted = true;
                oListBinding.detachCreateCompleted(fnCreateCompleted);
                oDialog.setBusy(false);

                if (bSuccess) {
                    MessageToast.show("실적이 생성되었습니다.");
                    oDialog.close();
                    this._refreshAfterSave();
                } else {
                    MessageBox.error(this._getErrorMessage(oError));
                }
            };

            const fnCreateCompleted = (oEvent) => {
                fnFinish(oEvent.getParameter("success"), oEvent.getParameter("error"));
            };

            oListBinding.attachCreateCompleted(fnCreateCompleted);
            oDialog.setBusy(true);
            oListBinding.create(oPayload);

            oModel.submitBatch("performanceCreate").catch((oError) => {
                fnFinish(false, oError);
            });

            setTimeout(() => {
                fnFinish(false, {
                    message: "저장 요청 응답이 지연되고 있습니다. SAP Gateway/Error Log 또는 ST22에서 create 오류를 확인하세요."
                });
            }, 30000);
        },

        // 실제 확정번호는 백엔드에서 자동 채번하며 이 값은 Create 요청용 임시 키다.
        // 임시 확정번호 생성
        // - 백엔드에서 번호를 최종 채번하더라도 create payload에는 키값이 필요할 수 있어 임시 번호를 만든다.
        // - 전기일의 YYYYMM과 현재 timestamp 일부를 조합해 화면 단에서 충돌 가능성을 낮춘다.
        // 화면에서 create 요청을 만들 때 사용하는 임시 실적번호.
        // - 전기일의 년월(yyyyMM) + 현재 timestamp 일부로 12자리 문자열을 만든다.
        // - 서버에서 별도 번호채번을 한다면 이 값은 임시 키 역할만 한다.
        _createTemporaryConfirmationNo(sPostingDate) {
            const sYearMonth = (sPostingDate || "").replaceAll("-", "").slice(0, 6);
            const sPrefix = sYearMonth || `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
            const sSuffix = String(Date.now() % 1000000).padStart(6, "0");

            return `${sPrefix}${sSuffix}`;
        },

        // 저장 트랜잭션 반영 후 서버 데이터를 다시 조회한다.
        // 저장 직후에는 Gateway 반영과 OData V4 캐시 갱신 타이밍이 살짝 어긋날 수 있으므로
        // 화면 셀을 직접 수정하지 않고, 짧게 기다린 뒤 서버 기준으로 목록/KPI/MM 알림 대상을 다시 읽는다.
        // 실적 저장 후 화면 데이터를 다시 맞춘다.
        // - OData V4 모델/리스트 바인딩에 남은 pending change를 먼저 정리한다.
        // - 서버에서 확정 상태와 누적 수량을 계산하는 시간이 있을 수 있어 짧은 지연 후 재조회한다.
        // - 공정 목록, KPI, MM 알림 대상이 모두 저장 결과의 영향을 받을 수 있다.
        _refreshAfterSave() {
            const oModel = this.getView().getModel();
            const oTable = this.byId("operationTable");
            const oBinding = oTable && oTable.getBinding("items");

            if (oModel.resetChanges) {
                oModel.resetChanges("performanceCreate");
            }

            if (oBinding && oBinding.hasPendingChanges && oBinding.hasPendingChanges() && oBinding.resetChanges) {
                oBinding.resetChanges();
            }

            setTimeout(() => {
                this._applyFilters(true);
                this._refreshMailTargets();
            }, 1200);
        },



        // 6. 공통 F4 팝업: 엔티티별 코드/명칭 필드를 같은 SelectDialog로 표시한다.
        // 공통 서치헬프 팝업
        // - orderNo/material은 생산오더 공정 조회 엔티티에서 후보를 가져온다.
        // - workCenter는 WorkCenters, operation은 RoutingOperations에서 가져와 기준정보에 가까운 후보를 보여준다.
        // - key/description/additional 조합으로 중복을 제거해서 같은 후보가 여러 번 보이지 않게 한다.
        // 상단 검색조건의 공통 서치헬프 팝업을 연다.
        // - sType 값에 따라 어떤 엔티티를 조회할지, 어떤 필드를 key/description으로 보여줄지 결정한다.
        // - 조회 결과는 valueHelp JSONModel에 담고 SelectDialog가 그 모델을 바인딩한다.
        // - 사용자가 팝업에서 항목을 선택하면 해당 key를 view>/filters에 넣는다.
        // - 공정 선택 시에는 관련 작업장을 함께 채워서 공정/작업장 조건이 맞게 유지되도록 한다.
        _openFilterValueHelp(sType) {
            const mConfig = {
                orderNo: {
                    title: "생산오더 선택",
                    source: "/ProductionOrderOperations",
                    key: "OrderNo",
                    description: "MaterialText",
                    additional: "Plant"
                },
                plant: {
                    title: "플랜트 선택",
                    source: "/ProductionOrderOperations",
                    key: "Plant",
                    description: "PlantName",
                    additional: ""
                },
                material: {
                    title: "자재 선택",
                    source: "/ProductionOrderOperations",
                    key: "Material",
                    description: "MaterialText",
                    additional: "Plant"
                },
                workCenter: {
                    title: "작업장 선택",
                    source: "/WorkCenters",
                    key: "WorkCenter",
                    description: "WorkCenterName",
                    additional: "Plant"
                },
                operation: {
                    title: "공정 선택",
                    source: "/RoutingOperations",
                    key: "OperationNo",
                    description: "OperationText",
                    additional: "WorkCenter"
                }
            };
            const oConfig = mConfig[sType];

            if (!oConfig) {
                return;
            }

            const oValueHelpModel = new JSONModel({ items: [] });
            const fnFilterItems = (oEvent) => {
                const sValue = oEvent.getParameter("value") || "";
                const oItemsBinding = oEvent.getSource().getBinding("items");
                const aSearchFilters = sValue ? [new Filter({
                    filters: [
                        new Filter("key", FilterOperator.Contains, sValue),
                        new Filter("description", FilterOperator.Contains, sValue),
                        new Filter("additional", FilterOperator.Contains, sValue)
                    ],
                    and: false
                })] : [];

                oItemsBinding.filter(aSearchFilters);
            };
            const oDialog = new SelectDialog({
                title: oConfig.title,
                noDataText: "선택 가능한 데이터가 없습니다.",
                rememberSelections: false,
                search: fnFilterItems,
                liveChange: fnFilterItems,
                confirm: (oEvent) => {
                    const oSelectedItem = oEvent.getParameter("selectedItem");

                    if (oSelectedItem) {
                        const oSelectedData = oSelectedItem.getBindingContext("valueHelp").getObject();
                        const oViewModel = this.getView().getModel("view");

                        oViewModel.setProperty(`/filters/${sType}`, oSelectedData.key);

                        if (sType === "operation") {
                            oViewModel.setProperty("/filters/workCenter", oSelectedData.additional || "");
                        }
                    }
                },
                afterClose: () => oDialog.destroy(),
                items: {
                    path: "valueHelp>/items",
                    template: new StandardListItem({
                        title: "{valueHelp>key}",
                        description: "{valueHelp>description}",
                        info: "{valueHelp>additional}"
                    })
                }
            });

            oDialog.setModel(oValueHelpModel, "valueHelp");
            this.getView().addDependent(oDialog);
            oDialog.setBusy(true);
            oDialog.open();

            this._requestValueHelpContexts(sType, oConfig)
                .then((aContexts) => {
                    const mSeen = new Set();
                    const aItems = aContexts.reduce((aResult, oContext) => {
                        const oData = oContext.getObject();
                        const sKey = String(oData[oConfig.key] || "");
                        const sDescription = String(oData[oConfig.description] || "");
                        const sAdditional = oConfig.additional ? String(oData[oConfig.additional] || "") : "";
                        const sUniqueKey = `${sKey}|${sDescription}|${sAdditional}`;

                        if (!sKey || mSeen.has(sUniqueKey)) {
                            return aResult;
                        }

                        mSeen.add(sUniqueKey);
                        aResult.push({
                            key: sKey,
                            description: sDescription,
                            additional: sAdditional
                        });
                        return aResult;
                    }, []).sort((oLeft, oRight) => oLeft.key.localeCompare(oRight.key));

                    oValueHelpModel.setProperty("/items", aItems);
                    oDialog.setBusy(false);
                })
                .catch((oError) => {
                    oDialog.setBusy(false);
                    MessageBox.error(this._getErrorMessage(oError));
                });
        },

        // 작업장은 WorkCenters, 공정은 RoutingOperations에서 읽고 선행 조건을 함께 적용한다.
        // 서치헬프 후보 조회
        // - 작업장은 선택된 플랜트가 있으면 플랜트 조건을 걸어 조회한다.
        // - 공정은 오더번호가 있으면 해당 오더의 라우팅/플랜트를 먼저 찾고 그 라우팅의 공정만 보여준다.
        // - 오더번호가 없을 때는 플랜트/작업장 조건만으로 RoutingOperations를 조회한다.
        _requestValueHelpContexts(sType, oConfig) {
            const oModel = this.getView().getModel();
            const oFilters = this.getView().getModel("view").getProperty("/filters");

            if (sType === "workCenter") {
                const aWorkCenterFilters = oFilters.plant
                    ? [new Filter("Plant", FilterOperator.EQ, oFilters.plant)]
                    : [];

                return oModel.bindList(oConfig.source, undefined, undefined, aWorkCenterFilters)
                    .requestContexts(0, 1000);
            }

            if (sType === "operation" && oFilters.orderNo) {
                const oOrderBinding = oModel.bindList(
                    "/ProductionOrderOperations",
                    undefined,
                    undefined,
                    [new Filter("OrderNo", FilterOperator.EQ, oFilters.orderNo)]
                );

                return oOrderBinding.requestContexts(0, 1).then((aOrderContexts) => {
                    if (!aOrderContexts.length) {
                        return [];
                    }

                    const oOrderData = aOrderContexts[0].getObject();
                    const aOperationFilters = [
                        new Filter("RoutingNo", FilterOperator.EQ, oOrderData.RoutingNo),
                        new Filter("Plant", FilterOperator.EQ, oOrderData.Plant)
                    ];

                    if (oFilters.workCenter) {
                        aOperationFilters.push(new Filter("WorkCenter", FilterOperator.EQ, oFilters.workCenter));
                    }

                    return oModel.bindList(oConfig.source, undefined, undefined, aOperationFilters)
                        .requestContexts(0, 1000);
                });
            }

            if (sType === "operation") {
                const aOperationFilters = [];
                if (oFilters.plant) {
                    aOperationFilters.push(new Filter("Plant", FilterOperator.EQ, oFilters.plant));
                }

                if (oFilters.workCenter) {
                    aOperationFilters.push(new Filter("WorkCenter", FilterOperator.EQ, oFilters.workCenter));
                }

                return oModel.bindList(oConfig.source, undefined, undefined, aOperationFilters)
                    .requestContexts(0, 1000);
            }

            return oModel.bindList(oConfig.source).requestContexts(0, 1000);
        },
        // REL 상태 생산오더만 실적 입력 대상으로 삼기 위한 공통 필터를 만든다.
        // /ProductionOrderOperations에는 오더 헤더 상태가 없을 수 있으므로,
        // 헤더 조회 엔티티 /ProductionOrders에서 REL 오더번호를 먼저 읽고
        // 그 오더번호들을 OR 조건으로 묶어 공정 목록과 KPI에 동일하게 적용한다.
        _requestRelOrderFilter() {
            const oModel = this.getView().getModel();
            const oBinding = oModel.bindList(
                "/ProductionOrders",
                undefined,
                undefined,
                [new Filter("ProductionStatus", FilterOperator.EQ, "REL")],
                {
                    $select: "OrderNo",
                    $$groupId: "$direct"
                }
            );

            return oBinding.requestContexts(0, 5000).then((aContexts) => {
                const aOrderFilters = [];
                const oSeen = new Set();

                aContexts.forEach((oContext) => {
                    const sOrderNo = oContext.getProperty("OrderNo");

                    if (sOrderNo && !oSeen.has(sOrderNo)) {
                        oSeen.add(sOrderNo);
                        aOrderFilters.push(new Filter("OrderNo", FilterOperator.EQ, sOrderNo));
                    }
                });

                oBinding.destroy();

                if (!aOrderFilters.length) {
                    return new Filter("OrderNo", FilterOperator.EQ, "__NO_REL_ORDER__");
                }

                return new Filter({
                    filters: aOrderFilters,
                    and: false
                });
            }).catch((oError) => {
                oBinding.destroy();
                throw oError;
            });
        },

        // 사용자가 입력한 검색조건에 "REL 생산오더만" 조건을 합쳐 최종 공정 조회 필터를 만든다.
        // - _buildOperationFilters는 화면 검색조건만 만든다.
        // - _requestRelOrderFilter는 생산오더 헤더에서 REL 오더번호 목록을 읽어 OR 필터를 만든다.
        // - 두 필터를 함께 적용해야 아직 실적 입력 가능한 오더의 공정만 화면에 보인다.
        _buildRelOperationFilters(bIncludeStatus = true) {
            const aFilters = this._buildOperationFilters(bIncludeStatus);

            return this._requestRelOrderFilter().then((oRelOrderFilter) => {
                aFilters.unshift(oRelOrderFilter);
                return aFilters;
            });
        },
        // 7. 화면의 검색 조건을 OData Filter 배열로 변환한다.
        // 화면 검색조건을 OData Filter 배열로 변환
        // - 오더/자재/플랜트/공정은 사용자가 코드나 명칭 일부만 입력해도 찾을 수 있도록 Contains 조건을 섞어 쓴다.
        // - 주차는 2자리 문자로 저장되는 구조라 1을 입력하면 01로 보정한다.
        // - KPI 계산에서는 상태별 전체 건수를 따로 세어야 하므로 bIncludeStatus=false로 상태 조건만 제외할 수 있게 했다.
        _buildOperationFilters(bIncludeStatus = true) {
            const oFilters = this.getView().getModel("view").getProperty("/filters");
            const aFilters = [];

            if (oFilters.orderNo) {
                aFilters.push(new Filter("OrderNo", FilterOperator.Contains, oFilters.orderNo));
            }

            if (oFilters.weekNo) {
                const sWeekNo = String(oFilters.weekNo).padStart(2, "0");
                aFilters.push(new Filter("WeekNo", FilterOperator.EQ, sWeekNo));
            }

            if (oFilters.plant) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Plant", FilterOperator.Contains, oFilters.plant),
                        new Filter("PlantName", FilterOperator.Contains, oFilters.plant)
                    ],
                    and: false
                }));
            }

            if (oFilters.material) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Material", FilterOperator.Contains, oFilters.material),
                        new Filter("MaterialText", FilterOperator.Contains, oFilters.material)
                    ],
                    and: false
                }));
            }

            if (oFilters.workCenter) {
                aFilters.push(new Filter("WorkCenter", FilterOperator.Contains, oFilters.workCenter));
            }

            if (oFilters.operation) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("OperationNo", FilterOperator.Contains, oFilters.operation),
                        new Filter("OperationText", FilterOperator.Contains, oFilters.operation)
                    ],
                    and: false
                }));
            }

            if (bIncludeStatus && oFilters.status && oFilters.status !== "ALL") {
                aFilters.push(new Filter("OperationStatus", FilterOperator.EQ, oFilters.status));
            }

            return aFilters;
        },

        // 공정 목록 테이블에 현재 검색조건을 적용한다.
        // - 조회/초기화/새로고침/저장 후 재조회에서 공통으로 사용한다.
        // - 필터 적용 전 선택 상세를 초기화해 이전 행의 상세가 남지 않게 한다.
        // - bForceRefresh=true이면 같은 필터여도 서버 데이터를 강제로 다시 읽는다.
        _applyFilters(bForceRefresh = false) {
            this._buildRelOperationFilters(true).then((aFilters) => {
                const oTable = this.byId("operationTable");
                const oBinding = oTable && oTable.getBinding("items");

                this._clearSelection();

                if (oBinding) {
                    // OData V4는 해당 ListBinding에 pending change가 남아 있으면 filter를 막는다.
                    // 공정 목록은 조회 전용이므로 남아 있는 transient 상태를 정리한 뒤 REL 필터를 다시 적용한다.
                    if (oBinding.hasPendingChanges && oBinding.hasPendingChanges() && oBinding.resetChanges) {
                        oBinding.resetChanges();
                    }

                    oBinding.filter(aFilters);

                    // 저장 직후나 새로고침 버튼에서는 같은 필터 조건이어도 서버 데이터를 강제로 다시 읽는다.
                    // 그렇지 않으면 OData V4 ListBinding이 기존 컨텍스트를 유지해서 상태값이 늦게 보일 수 있다.
                    if (bForceRefresh && oBinding.refresh) {
                        oBinding.refresh();
                    }
                }

                this._refreshKpiCounts();
            }).catch((oError) => {
                MessageBox.error(this._getErrorMessage(oError));
            });
        },

        // 8. 무거운 상태별 count 요청 대신 상태 필드만 한 번 조회해 KPI를 계산한다.
        // KPI 카운트 재계산
        // - 현재 필터 조건에서 상태 조건만 제외한 뒤 OperationStatus만 조회한다.
        // - 화면에서 빠르게 필터를 바꿀 수 있으므로 250ms debounce와 요청 번호를 같이 사용한다.
        // - 늦게 도착한 이전 요청은 _iKpiRequestId 비교로 무시한다.
        _refreshKpiCounts() {
            const iRequestId = (this._iKpiRequestId || 0) + 1;

            this._iKpiRequestId = iRequestId;
            clearTimeout(this._iKpiRefreshTimer);
            this._iKpiRefreshTimer = setTimeout(() => {
                this._buildRelOperationFilters(false).then((aFilters) => {
                    const oBinding = this.getView().getModel().bindList(
                        "/ProductionOrderOperations",
                        undefined,
                        undefined,
                        aFilters,
                        {
                            $count: true,
                            $select: "OperationStatus",
                            $$groupId: "$direct"
                        }
                    );

                    oBinding.requestContexts(0, 5000).then((aContexts) => {
                    if (iRequestId !== this._iKpiRequestId) {
                        oBinding.destroy();
                        return;
                    }

                    const oKpi = {
                        total: aContexts.length,
                        wait: 0,
                        run: 0,
                        done: 0
                    };

                    aContexts.forEach((oContext) => {
                        const sStatus = oContext.getProperty("OperationStatus");

                        if (sStatus === "WAIT") {
                            oKpi.wait += 1;
                        } else if (sStatus === "RUN") {
                            oKpi.run += 1;
                        } else if (sStatus === "DONE") {
                            oKpi.done += 1;
                        }
                    });

                    this.getView().getModel("view").setProperty("/kpi", oKpi);
                    oBinding.destroy();
                    }).catch(() => {
                        oBinding.destroy();
                    });
                }).catch(() => {
                    this.getView().getModel("view").setProperty("/kpi", {
                        total: 0,
                        wait: 0,
                        run: 0,
                        done: 0
                    });
                });
            }, 250);
        },
        // 9. 선택 Context를 상세 모델에 복사하고 지연 속성도 명시적으로 요청한다.
        // 선택 공정 상세 세팅
        // - ListItem의 binding context를 복사해서 view>/selected에 저장한다.
        // - 일부 속성은 $select나 lazy loading 영향으로 늦게 들어올 수 있어 requestProperty로 한 번 더 보강한다.
        // - 요청 중 다른 행이 선택되면 selectedKey를 비교해서 이전 응답이 새 선택값을 덮지 못하게 한다.
        _setSelectedOperation(oContext, bOpenDetail = true) {
            if (!oContext) {
                return;
            }

            const oData = Object.assign({}, oContext.getObject());
            this.getView().getModel("view").setProperty("/selectedKey", {
                OrderNo: oData.OrderNo,
                OperationNo: oData.OperationNo,
                OrderItemNo: oData.OrderItemNo
            });
            this.getView().getModel("view").setProperty("/selected", oData);
            this.getView().getModel("view").setProperty("/hasSelection", true);

            if (bOpenDetail) {
                this.getView().getModel("view").setProperty("/detailVisible", true);
            }

            if (oContext.requestProperty) {
                Promise.all([
                    oContext.requestProperty("PlantName"),
                    oContext.requestProperty("BasicStartDate"),
                    oContext.requestProperty("BasicEndDate"),
                    oContext.requestProperty("OrderQty"),
                    oContext.requestProperty("OrderItemNo"),
                    oContext.requestProperty("StdMachineTime").catch(() => ""),
                    oContext.requestProperty("StdLaborTime").catch(() => ""),
                    oContext.requestProperty("StdBaseQty").catch(() => "")
                ]).then(([sPlantName, sBasicStartDate, sBasicEndDate, sOrderQty, sOrderItemNo, sStdMachineTime, sStdLaborTime, sStdBaseQty]) => {
                    const oViewModel = this.getView().getModel("view");
                    const oSelectedKey = oViewModel.getProperty("/selectedKey") || {};

                    if (oSelectedKey.OrderNo !== oData.OrderNo
                        || oSelectedKey.OperationNo !== oData.OperationNo
                        || oSelectedKey.OrderItemNo !== oData.OrderItemNo) {
                        return;
                    }

                    oViewModel.setProperty("/selected/PlantName", sPlantName || "");
                    oViewModel.setProperty("/selected/BasicStartDate", sBasicStartDate || "");
                    oViewModel.setProperty("/selected/BasicEndDate", sBasicEndDate || "");
                    oViewModel.setProperty("/selected/OrderQty", sOrderQty || "0");
                    oViewModel.setProperty("/selected/OrderItemNo", sOrderItemNo || "");
                    oViewModel.setProperty("/selected/StdMachineTime", sStdMachineTime || "0");
                    oViewModel.setProperty("/selected/StdLaborTime", sStdLaborTime || "0");
                    oViewModel.setProperty("/selected/StdBaseQty", sStdBaseQty || "1");
                });
            }
        },

        // 목록 재조회 후에도 기존 선택행을 찾아 우측 상세를 최신 데이터로 유지한다.
        // 목록 재조회 후 선택 상세 유지
        // - 저장이나 refresh 후에도 기존에 열려 있던 상세 패널을 닫지 않고 최신 데이터로 다시 맞춘다.
        // - OrderNo/OperationNo/OrderItemNo 세 키가 모두 같은 행을 찾아 selected를 갱신한다.
        _refreshSelectedOperation(aItems) {
            const oViewModel = this.getView().getModel("view");
            const oSelectedKey = oViewModel.getProperty("/selectedKey");

            if (!oViewModel.getProperty("/detailVisible")
                || !oSelectedKey
                || !oSelectedKey.OrderNo
                || !oSelectedKey.OperationNo) {
                return;
            }

            const oSelectedItem = aItems.find((oItem) => {
                const oContext = oItem.getBindingContext();

                return oContext
                    && oContext.getProperty("OrderNo") === oSelectedKey.OrderNo
                    && oContext.getProperty("OperationNo") === oSelectedKey.OperationNo
                    && oContext.getProperty("OrderItemNo") === oSelectedKey.OrderItemNo;
            });

            if (oSelectedItem) {
                this._setSelectedOperation(oSelectedItem.getBindingContext(), false);
            }
        },

        // 현재 선택된 공정 정보를 모두 초기화한다.
        // - 필터를 바꾸거나 목록을 다시 조회할 때 기존 상세 패널이 잘못된 데이터를 보여주지 않게 한다.
        _clearSelection() {
            const oViewModel = this.getView().getModel("view");

            oViewModel.setProperty("/selectedKey", null);
            oViewModel.setProperty("/selected", {});
            oViewModel.setProperty("/hasSelection", false);
            oViewModel.setProperty("/detailVisible", false);
        },

        // OData/Gateway 오류 메시지를 사용자에게 보여주기 좋은 문자열로 꺼낸다.
        // - UI5 오류 객체의 message가 기본값이다.
        // - Gateway responseText 안에 JSON 형태의 error.message가 있으면 그것을 우선 사용한다.
        _getErrorMessage(oError) {
            const sMessage = oError?.message || "실적 생성 중 오류가 발생했습니다.";

            try {
                const sResponseText = oError.error?.responseText || oError.responseText || "{}";
                const oBody = JSON.parse(sResponseText);
                return oBody.error?.message || sMessage;
            } catch (e) {
                return sMessage;
            }
        }
    });
});
























