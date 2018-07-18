// Dependencies

const crypto = require('crypto');
const config = require('./config');

// Container for helpers

const helpers = {};

// Create a SHA256 hash

helpers.hash = function(string) {
    if(typeof(string) == 'string' && string.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse JSON string to an object in all cases without throwing

helpers.parseJsonToObject = function(string) {
    try {
        const obj = JSON.parse(string);
        return obj;
    } catch(e) {
        return {};
    }
}

helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for(i = 1; i <= strLength; i++){
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }
        return str;

    } else {
        return false;
    }
}

module.exports = helpers;