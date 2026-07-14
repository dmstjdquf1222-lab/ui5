sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zuifec12/test/integration/pages/ZC_TFEC12List",
	"zuifec12/test/integration/pages/ZC_TFEC12ObjectPage"
], function (JourneyRunner, ZC_TFEC12List, ZC_TFEC12ObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zuifec12') + '/test/flp.html#app-preview',
        pages: {
			onTheZC_TFEC12List: ZC_TFEC12List,
			onTheZC_TFEC12ObjectPage: ZC_TFEC12ObjectPage
        },
        async: true
    });

    return runner;
});

