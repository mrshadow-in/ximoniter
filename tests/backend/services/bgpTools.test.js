const bgpToolsService = require('../../../backend/services/bgpToolsService');
const axios = require('axios');
const assert = require('assert');

// Mock axios
const originalGet = axios.get;
axios.get = async (url) => {
    if (url.includes('ipinfo.io/AS13335/json')) {
        return {
            data: {
                asn: 'AS13335',
                name: 'CLOUDFLARENET',
                country: 'US'
            }
        };
    }
    throw new Error('Not found: ' + url);
};

async function testASNLookup() {
    try {
        const res = await bgpToolsService.lookupASN('13335'); // Cloudflare
        assert.strictEqual(res.asn, '13335');
        assert.strictEqual(res.name, 'CLOUDFLARENET');
        assert.strictEqual(res.country, 'US');
        console.log("Task 9.1 IPInfo ASN Lookup Test Passed");
        
        // Test Cache
        axios.get = () => { throw new Error('Should not be called'); };
        const cachedRes = await bgpToolsService.lookupASN('13335');
        assert.strictEqual(cachedRes.asn, '13335');
        console.log("Task 9.1 Cache Test Passed");
    } finally {
        axios.get = originalGet;
    }
}

testASNLookup().catch(err => {
    console.error(err);
    process.exit(1);
});
