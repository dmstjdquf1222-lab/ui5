sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheZC_TFEC12List.iSeeThisPage();
            Then.onTheZC_TFEC12List.onFilterBar().iCheckFilterField("항공사");
            Then.onTheZC_TFEC12List.onFilterBar().iCheckFilterField("연결 번호");
            Then.onTheZC_TFEC12List.onFilterBar().iCheckFilterField("항공편 일자");
            Then.onTheZC_TFEC12List.onTable().iCheckColumns(9, {"CarrierID":{"header":"항공사"},"ConnectionID":{"header":"연결 번호"},"FlightDate":{"header":"항공편 일자"},"Price":{"header":"항공 요금"},"CurrencyCode":{"header":"항공사 통화"},"PlaneTypeID":{"header":"항공기 유형"},"SeatsMax":{"header":"일반석 최대 정원"},"SeatsOccupied":{"header":"탑승(일반석)"},"CreatedBy":{"header":"생성자"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheZC_TFEC12List.onFilterBar().iExecuteSearch();
            
            Then.onTheZC_TFEC12List.onTable().iCheckRows();

            When.onTheZC_TFEC12List.onTable().iPressRow(0);
            Then.onTheZC_TFEC12ObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});