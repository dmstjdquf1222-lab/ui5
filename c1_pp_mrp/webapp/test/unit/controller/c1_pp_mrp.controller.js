/*global QUnit*/

sap.ui.define([
	"c1/pp/c1ppmrp/controller/c1_pp_mrp.controller"
], function (Controller) {
	"use strict";

	QUnit.module("c1_pp_mrp Controller");

	QUnit.test("I should test the c1_pp_mrp controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
