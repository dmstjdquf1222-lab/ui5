/*global QUnit*/

sap.ui.define([
	"cl3/student/project2/controller/StudentView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("StudentView Controller");

	QUnit.test("I should test the StudentView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
