sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("cl3.student.project2.controller.StudentView", {
        onInit() {
        },
        onDisplay() {
            let aIndex = this.getView().byId("Student").getSelectedIndices(),
                oData = this.getView().byId("Student").getContextByIndex(aIndex[0]).getObject(),
                oModel = this.getView().getModel();

            oModel.read("/StudentSet(StdtNo='" + oData.StdtNo + "')",
                {
                    success: function (oReturn) {
                        this.getView().byId("StdtNo").setValue(oReturn.StdtNo);
                        this.getView().byId("Major").setValue(oReturn.Major);
                        this.getView().byId("StdtName").setValue(oReturn.StdtName);
                        this.getView().byId("Addr").setValue(oReturn.Addr);
                        this.getView().byId("Email").setValue(oReturn.Email);
                        this.getView().byId("Gender").setValue(oReturn.Gender);
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
                StdtNo: this.getView().byId("StdtNo").getValue(),
                Major: this.getView().byId("Major").getValue(),
                StdtName: this.getView().byId("StdtName").getValue(),
                Addr: this.getView().byId("Addr").getValue(),
                Email: this.getView().byId("Email").getValue(),
                Gender: this.getView().byId("Gender").getValue()
            };

            oModel.create("/StudentSet", oData, {
                success() {
                    oModel.refresh();
                    MessageToast.show("Create success");
                },
                error() {
                    MessageToast.show("Create error!")
                }
            })

        },
        onUpdate() {
            let oModel = this.getView().getModel();

            var vStdtNo = this.getView().byId("StdtNo").getValue();

            let oData = {
                StdtNo: this.getView().byId("StdtNo").getValue(),
                Major: this.getView().byId("Major").getValue(),
                StdtName: this.getView().byId("StdtName").getValue(),
                Addr: this.getView().byId("Addr").getValue(),
                Email: this.getView().byId("Email").getValue(),
                Gender: this.getView().byId("Gender").getValue()
            };

            oModel.update("/StudentSet('" + vStdtNo + "')", oData, {
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
            let aIndex = this.getView().byId("Student").getSelectedIndices();

            if (aIndex.length < 1) {
                MessageToast.show("Please selecte row");
                return;
            }

            var oData = this.getView().byId("Student").getContextByIndex(aIndex[0]).getObject();

            oModel.remove("/StudentSet('" + oData.StdtNo + "')", {
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