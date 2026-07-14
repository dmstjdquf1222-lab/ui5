/*global QUnit*/

sap.ui.define([
	"code1/cl312/airlinesplit12/controller/SplitView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SplitView Controller");

	QUnit.test("I should test the SplitView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
