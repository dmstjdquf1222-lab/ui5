sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, MessageToast, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("testcl312.cl3.testcl312.controller.TestView", {
        onInit() {
        },
        onSearch() {
            var aFilter = [];
            var vRemark = this.getView().byId("Remark2").getValue();
            var vBelnr = this.getView().byId("Documentno").getValue();

            if (vRemark) {
                aFilter.push(new Filter("Remark", FilterOperator.EQ, vRemark));
            }
            if (vBelnr) {
                aFilter.push(new Filter("Belnr", FilterOperator.Contains, vBelnr)); // Numeric type은 EQ연산자만 가능. Contains 안됨
            }

            this.getView().byId("shopping").getBinding("rows").filter(aFilter);
        },
        onClear() {
            this.getView().byId("Ryear").setValue();
            this.getView().byId("Rbukrs").setValue();
            this.getView().byId("Belnr").setValue();
            this.getView().byId("Racct").setValue();
            this.getView().byId("Remark").setValue();
            this.getView().byId("Hsl").setValue();
            this.getView().byId("Rtcur").setValue();
            this.getView().byId("PostYn").setValue();
        },
        onDisplay() {
            let aIndex = this.getView().byId("shopping").getSelectedIndices(),
                oData = this.getView().byId("shopping").getContextByIndex(aIndex[0]).getObject(),
                oModel = this.getView().getModel();

            oModel.read("/shoppingSet(Ryear='" + oData.Ryear + "',Rbukrs='" + oData.Rbukrs + "',Belnr='" + oData.Belnr + "')",
                {
                    success: function (oReturn) {
                        this.getView().byId("Ryear").setValue(oReturn.Ryear);
                        this.getView().byId("Rbukrs").setValue(oReturn.Rbukrs);
                        this.getView().byId("Belnr").setValue(oReturn.Belnr);
                        this.getView().byId("Racct").setValue(oReturn.Racct);
                        this.getView().byId("Remark").setValue(oReturn.Remark);
                        this.getView().byId("Hsl").setValue(oReturn.Hsl);
                        this.getView().byId("Rtcur").setValue(oReturn.Rtcur);
                        this.getView().byId("PostYn").setValue(oReturn.PostYn);
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Read error");
                    }
                }
            )
        },
        onCreate() {
            let oModel = this.getView().getModel();

            var oData = {
                Ryear: this.getView().byId("Ryear").getValue(),
                Rbukrs: this.getView().byId("Rbukrs").getValue(),
                Belnr: this.getView().byId("Belnr").getValue(),
                Racct: this.getView().byId("Racct").getValue(),
                Remark: this.getView().byId("Remark").getValue(),
                Hsl: this.getView().byId("Hsl").getValue(),
                Rtcur: this.getView().byId("Rtcur").getValue(),
                PostYn: this.getView().byId("PostYn").getValue()
            };
            console.log(oData)
            oModel.create("/shoppingSet", oData, {
                success() {
                    oModel.refresh();
                    MessageToast.show("Create success");
                },
                error() {
                    MessageToast.show("Create error!")
                }
            })

        },
        onEdit() {
            let oModel = this.getView().getModel();

            var vRyear = this.getView().byId("Ryear").getValue(),
                vRbukrs = this.getView().byId("Rbukrs").getValue(),
                vBelnr = this.getView().byId("Belnr").getValue();

            let oData = {
                Ryear: this.getView().byId("Ryear").getValue(),
                Rbukrs: this.getView().byId("Rbukrs").getValue(),
                Belnr: this.getView().byId("Belnr").getValue(),
                Racct: this.getView().byId("Racct").getValue(),
                Remark: this.getView().byId("Remark").getValue(),
                Hsl: this.getView().byId("Hsl").getValue(),
                Rtcur: this.getView().byId("Rtcur").getValue(),
                PostYn: this.getView().byId("PostYn").getValue()
            };

            oModel.update("/shoppingSet(Ryear='" + vRyear + "',Rbukrs='" + vRbukrs + "',Belnr='" + vBelnr + "')", oData,
                {
                    success() {
                        oModel.refresh();
                        MessageToast.show("Update success");
                    },
                    error() {
                        MessageToast.show("Update error!");
                    }
                })
        },
        onDelete() {
            var oModel = this.getView().getModel();
            let aIndex = this.getView().byId("shopping").getSelectedIndices();

            if (aIndex.length < 1) {
                MessageToast.show("Please selecte row");
                return;
            }

            var oData = this.getView().byId("shopping").getContextByIndex(aIndex[0]).getObject();

            oModel.remove("/shoppingSet(Ryear='" + oData.Ryear + "',Rbukrs='" + oData.Rbukrs + "',Belnr='" + oData.Belnr + "')",
                {
                    success() {
                        oModel.refresh();
                        MessageToast.show("Delete success!");
                    },
                    error() {
                        MessageToast.show("Delete error!");
                    }
                })
        }
    });
});