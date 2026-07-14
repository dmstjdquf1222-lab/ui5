sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'zuifec12',
            componentId: 'ZC_TFEC12List',
            contextPath: '/ZC_TFEC12'
        },
        CustomPageDefinitions
    );
});