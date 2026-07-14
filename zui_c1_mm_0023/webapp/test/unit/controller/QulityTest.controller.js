/*global QUnit*/

sap.ui.define([
	"c1/mm/zuic1mm0023/controller/QulityTest.controller"
], function (Controller) {
	"use strict";

	QUnit.module("QulityTest Controller");

	QUnit.test("I should test the QulityTest controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
