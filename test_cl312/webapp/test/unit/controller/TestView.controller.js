/*global QUnit*/

sap.ui.define([
	"testcl312/cl3/testcl312/controller/TestView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("TestView Controller");

	QUnit.test("I should test the TestView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
