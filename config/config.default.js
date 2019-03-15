'use strict';

/**
 * egg-aelf default config
 * @member Config#aelf
 * @property {String} SOME_KEY - some description
 */
exports.aelf = {
    initRequestLimit: 20, // default: 20
    app: true,
    metaSource: 'http://127.0.0.1:7101/api/nodes/info'
};
