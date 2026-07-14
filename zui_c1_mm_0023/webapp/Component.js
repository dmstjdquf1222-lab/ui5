sap.ui.define([
    "sap/ui/core/UIComponent",
    "c1/mm/zuic1mm0023/model/models"
], function (UIComponent, models) {
    "use strict";

    return UIComponent.extend("c1.mm.zuic1mm0023.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            this.getRouter().initialize();
        }
    });
});
