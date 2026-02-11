/*global QUnit*/

sap.ui.define([
	"cl3/mat/matnrcl3ui501/controller/MatView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("MatView Controller");

	QUnit.test("I should test the MatView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
