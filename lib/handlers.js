/* 
* Request Handlers
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define handlers
const handlers = {};

// Users

handlers.users = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - POST
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Check all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Make sure that the user doesn't already exist
        _data.read('users', phone, function(err, data){
            if(err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword){
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };
    
                    // Store the user
                    _data.create('users', phone, userObject, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not has the user\'s password'});
                }

            } else {
                callback(400, {'Error': 'A user with that phone number already exists'});
            }

        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO only let an authenticated user access their object. Don't let them access others.
handlers._users.get = function(data, callback) {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, function(err, data) {
            if(!err && data) {
                // Remove the hashed password from user object before returning to requester.
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specificed)
// @TODO only let an authenticated user update their own object.
handlers._users.put = function(data, callback) {
    // Chec for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    if (phone) {
        if (firstName || lastName || password) {
            _data.read('users', phone, function(err, userData){
                if(!err && userData){
                    if(firstName){
                        userData.firstName = firstName;
                    }
                    if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }
                    _data.update('users', phone, userData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not update the user'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'The specified user does not exist'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - DELETE
// Required field = phone
// @TODO - only let an authenticated user delete their own object
// @TODO - cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
    // Check that the phone number is valid.
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, function(err, data) {
            if(!err && data) {
                _data.delete('users', phone, function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the specified user'});
                    }
                })
            } else {
                callback(400, {'Error': 'Could not find specified user'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }    
};

// Tokens

handlers.tokens = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens methods

handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password) {
        _data.read('users', phone, function(err, userData){
            if(!err && userData) {
                // Hash the sent password and compare it to the password stored.

                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword) {
                    // If valid create a new token with a random name. Set expiration date 1 hour in future.
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token.
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create new token'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Password did not match the specified user\'s stored password'})
                }
            } else {    
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s)'})
    }
};

// Tokens - get
// Required data : id
// Optional data : none
handlers._tokens.get = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {

                callback(200, tokenData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
}
// Tokens - put
// Required fields: id, extend
// Optional fields:  none
handlers._tokens.put = function(data, callback) {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 100 * 60 * 60;
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update the token\'s expiration.'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'The token has expired and cannot be extended.'});
                }
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) are invalid.'})
    }
}
// Tokens - delete
// Required data : id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, function(err, data) {
            if(!err && data) {
                _data.delete('tokens', id, function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the specified token'});
                    }
                })
            } else {
                callback(400, {'Error': 'Could not find specified token'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
}

// Ping handler
handlers.ping = function(data, callback) {
    callback(200);
}

handlers.notFound = function(data, callback) {
    callback(404);
};

module.exports = handlers;