/*global QUnit*/

sap.ui.define([
	"cl3/concat/codecl3ui501/controller/ConcatPractice.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ConcatPractice Controller");

	QUnit.test("I should test the ConcatPractice controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
