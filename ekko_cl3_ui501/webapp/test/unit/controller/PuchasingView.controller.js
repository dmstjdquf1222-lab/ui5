/*global QUnit*/

sap.ui.define([
	"cl3/purch/ekkocl3ui501/controller/PuchasingView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PuchasingView Controller");

	QUnit.test("I should test the PuchasingView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
