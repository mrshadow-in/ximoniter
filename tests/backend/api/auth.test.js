const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');

async function testLogin() {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin_password_2026' });
        
    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    assert.ok(res.body.token, "Should return a JWT token");
    console.log("Task 3.2 Auth API Test Passed");
    process.exit(0);
}
testLogin().catch(err => { console.error(err); process.exitCode = 1; });
