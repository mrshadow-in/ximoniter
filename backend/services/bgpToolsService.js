const axios = require('axios');
const cache = new Map();

async function lookupASN(asn) {
    if (cache.has(`asn_${asn}`)) return cache.get(`asn_${asn}`);
    try {
        const response = await axios.get(`https://api.bgpview.io/asn/${asn}`);
        const data = {
            asn: response.data.data.asn.toString(),
            name: response.data.data.name,
            country: response.data.data.country_code
        };
        cache.set(`asn_${asn}`, data);
        setTimeout(() => cache.delete(`asn_${asn}`), 600000).unref(); // 10 min TTL
        return data;
    } catch (err) {
        throw new Error('Failed to fetch ASN data');
    }
}

module.exports = { lookupASN };
