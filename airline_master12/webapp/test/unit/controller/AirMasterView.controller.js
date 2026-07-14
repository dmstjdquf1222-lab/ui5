/*global QUnit*/

sap.ui.define([
	"cl3/airlinemaster/airlinemaster12/controller/AirMasterView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("AirMasterView Controller");

	QUnit.test("I should test the AirMasterView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
