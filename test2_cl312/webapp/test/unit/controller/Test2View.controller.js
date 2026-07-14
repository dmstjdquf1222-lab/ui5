/*global QUnit*/

sap.ui.define([
	"test2/cl312/test2cl312/controller/Test2View.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Test2View Controller");

	QUnit.test("I should test the Test2View controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
