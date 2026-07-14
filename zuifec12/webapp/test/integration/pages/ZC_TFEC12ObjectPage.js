sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'zuifec12',
            componentId: 'ZC_TFEC12ObjectPage',
            contextPath: '/ZC_TFEC12'
        },
        CustomPageDefinitions
    );
});