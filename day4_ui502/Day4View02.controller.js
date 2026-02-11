// SAP의 SCARR테이블
    const gt_scarr = [
        {
            CARRID: "AA",
            CARRNAME: "American Airlines",
            CURRCODE: "USD",
            URL: "http://www.aa.com"
        },
        {
            CARRID: "AB",
            CARRNAME: "Air Berlin",
            CURRCODE: "EUR",
            URL: "http://www.airberlin.de"
        },
        {
            CARRID: "AC",
            CARRNAME: "Air Canada",
            CURRCODE: "CAD",
            URL: "http://www.aircanada.ca"
        },
        {
            CARRID: "AF",
            CARRNAME: "Air France",
            CURRCODE: "EUR",
            URL: "http://www.airfrance.fr"
        },
        {
            CARRID: "AZ",
            CARRNAME: "Alitalia",
            CURRCODE: "EUR",
            URL: "http://www.alitalia.it"
        },
        {
            CARRID: "BA",
            CARRNAME: "British Airways",
            CURRCODE: "GBP",
            URL: "http://www.british-airways.com"
        },
        {
            CARRID: "CO",
            CARRNAME: "Continental Airlines",
            CURRCODE: "USD",
            URL: "http://www.continental.com"
        },
        {
            CARRID: "DL",
            CARRNAME: "Delta Airlines",
            CURRCODE: "USD",
            URL: "http://www.delta-air.com"
        },
        {
            CARRID: "FJ",
            CARRNAME: "Air Pacific",
            CURRCODE: "USD",
            URL: "http://www.airpacific.com"
        },
        {
            CARRID: "JL",
            CARRNAME: "Japan Airlines",
            CURRCODE: "JPY",
            URL: "http://www.jal.co.jp"
        }
    ];

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.day4ui502.controller.Day4View02", {
        onInit() {
        },
        onCreat() {
            this.getView().byId("btn_create").setIcon("sap-icon://accept");
            this.getView().byId("btn_search").setIcon("");
            this.getView().byId("btn_update").setIcon("");
            this.getView().byId("btn_delete").setIcon("");

        },
        onSearch() {
            this.getView().byId("btn_create").setIcon("");
            this.getView().byId("btn_search").setIcon("sap-icon://accept");
            this.getView().byId("btn_update").setIcon("");
            this.getView().byId("btn_delete").setIcon("");

        },
        onUpdate() {
            this.getView().byId("btn_create").setIcon("");
            this.getView().byId("btn_search").setIcon("");
            this.getView().byId("btn_update").setIcon("sap-icon://accept");
            this.getView().byId("btn_delete").setIcon("");

        },
        onDelete() {
            this.getView().byId("btn_create").setIcon("");
            this.getView().byId("btn_search").setIcon("");
            this.getView().byId("btn_update").setIcon("");
            this.getView().byId("btn_delete").setIcon("sap-icon://accept");

        },
    });
});