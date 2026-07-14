/*global QUnit*/

sap.ui.define([
	"gatewaypractice/gatewaypractice/controller/GatewayPracticeView1.controller"
], function (Controller) {
	"use strict";

	QUnit.module("GatewayPracticeView1 Controller");

	QUnit.test("I should test the GatewayPracticeView1 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
