sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast"
], (Controller, ODataModel, MessageToast) => {
    "use strict";

    return Controller.extend("cl3.airlinemaster.airlinemaster12.controller.AirMasterView", {
        onInit() {
            var oModel = new ODataModel("/sap/opu/odata/SAP/ZGWCL312_02_SRV/");

            this.getView().setModel(oModel, "Schedule");

        },
        onDisplay() {
            var oTable = this.getView().byId("air");
            let aIndex = oTable.getSelectedIndices(),
                oData = oTable.getContextByIndex(aIndex[0]).getObject(),
                oModel = this.getView().getModel("Schedule");

            oModel.read("/AirlineSet('" + oData.Carrid + "')",
                {
                    success: function (oReturn) {
                        this.getView().byId("Carrid").setValue(oReturn.Carrid);
                        this.getView().byId("Carrname").setValue(oReturn.Carrname);
                        this.getView().byId("Currcode").setValue(oReturn.Currcode);
                        this.getView().byId("Url").setValue(oReturn.Url);
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Read error");
                    }
                }
            )
        },
        onCreate() {
            let oModel = this.getView().getModel("Schedule");

            var oData = {
                Carrid: this.getView().byId("Carrid").getValue(),
                Carrname: this.getView().byId("Carrname").getValue(),
                Currcode: this.getView().byId("Currcode").getValue(),
                Url: this.getView().byId("Url").getValue()
            };

            oModel.create("/AirlineSet", oData, {
                success(oReturn) {
                    oModel.refresh();
                    MessageToast.show("Create success");
                },
                error() {
                    MessageToast.show("Create error!")
                }
            })

        },
        onUpdate() {
            let oModel = this.getView().getModel("Schedule");

            var vCarrid = this.getView().byId("Carrid").getValue();

            let oData = {
                Carrid: this.getView().byId("Carrid").getValue(),
                Carrname: this.getView().byId("Carrname").getValue(),
                Currcode: this.getView().byId("Currcode").getValue(),
                Url: this.getView().byId("Url").getValue()
            };

            oModel.update("/AirlineSet('" + vCarrid + "')", oData, {
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
            var oModel = this.getView().getModel("Schedule");
            let aIndex = this.getView().byId("air").getSelectedIndices();

            if (aIndex.length < 1) {
                MessageToast.show("Please selecte row");
                return;
            }

            var oData = this.getView().byId("air").getContextByIndex(aIndex[0]).getObject();

            oModel.remove("/AirlineSet('" + oData.Carrid + "')", {
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