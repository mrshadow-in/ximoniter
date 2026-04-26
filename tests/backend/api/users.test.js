const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const env = require('../../../backend/config/env');

const token = jwt.sign({ id: 1, role: 'super_admin' }, env.JWT_SECRET);

async function testUsersAPI() {
    console.log("Running Task 8.1 Users API Test...");
    
    const getRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
    
    assert.strictEqual(getRes.status, 200);
    assert.ok(Array.isArray(getRes.body.data));
    assert.ok(getRes.body.data.some(u => u.username === 'admin'));
    
    console.log("Task 8.1 Users API Test Passed");
}

if (require.main === module) {
    testUsersAPI().catch(err => { 
        console.error(err); 
        process.exit(1); 
    });
}
