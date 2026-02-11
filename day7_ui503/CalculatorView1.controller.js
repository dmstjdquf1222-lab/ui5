var result = '';
var calcul = '';
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.day7ui503.controller.CalculatorView1", {
        onInit() {
            
        },
        onPress(val){
            if(val==''){
                calcul = '';
                result = '';
                this.getView().byId("ipt1").setValue("");
                return;
            };

            switch(val){
                case 'eq' : 
                    result = eval(calcul);
                    this.getView().byId("ipt1").setValue(result);
                    break;

                default:
                    calcul += val;
                    this.getView().byId("ipt1").setValue(calcul);
                    break;
            }
        }
        
    });
});