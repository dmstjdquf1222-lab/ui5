/*global QUnit*/

sap.ui.define([
	"c1/pp/c1ppperformance/controller/c1_pp_performance.controller"
], function (Controller) {
	"use strict";

	QUnit.module("c1_pp_performance Controller");

	QUnit.test("I should test the c1_pp_performance controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
