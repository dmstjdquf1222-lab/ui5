/*global QUnit*/

sap.ui.define([
	"c1/pp/c1pporder/controller/c1_pp_order.controller"
], function (Controller) {
	"use strict";

	QUnit.module("c1_pp_order Controller");

	QUnit.test("I should test the c1_pp_order controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
