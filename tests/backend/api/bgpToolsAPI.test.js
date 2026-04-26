const request = require('supertest');
const app = require('../../../backend/server');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const env = require('../../../backend/config/env'); // Ensure you get the actual secret
const token = jwt.sign({ id: 1, role: 'admin' }, env.JWT_SECRET);

// Mock axios
const originalGet = axios.get;
axios.get = async (url) => {
    if (url.includes('api.bgpview.io/asn/13335')) {
        return {
            data: {
                data: {
                    asn: 13335,
                    name: 'CLOUDFLARENET',
                    country_code: 'US'
                }
            }
        };
    }
    throw new Error('Not found');
};

async function testAPI() {
    try {
        const res = await request(app).get('/api/bgp-tools/asn/13335').set('Authorization', `Bearer ${token}`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.data.asn, '13335');
        console.log("Task 5.2 BGP Tools API Passed");
    } finally {
        axios.get = originalGet;
    }
}
testAPI().catch(err => { 
    console.error("Test failed:");
    console.error(err); 
    process.exit(1); 
});
