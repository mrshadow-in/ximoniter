const verifyJWT = require('../../../backend/middleware/verifyJWT');
const assert = require('assert');

function testNoToken() {
    const req = { headers: {} };
    const res = { 
        status: (code) => { 
            assert.strictEqual(code, 401); 
            return { json: (data) => assert.strictEqual(data.code, "AUTH_REQUIRED") };
        }
    };
    let nextCalled = false;
    
    verifyJWT(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, "Next should not be called without a token");
    console.log("Task 3.1 Middleware Test Passed");
}
testNoToken();
