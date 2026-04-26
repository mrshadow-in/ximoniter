const axios = require('axios');
const env = require('../config/env');
const cache = new Map();

async function lookupASN(asn) {
    // Clean input: remove 'AS' prefix if present
    const cleanAsn = asn.toString().toUpperCase().replace('AS', '').trim();
    
    if (cache.has(`asn_${cleanAsn}`)) return cache.get(`asn_${cleanAsn}`);
    
    try {
        const tokenParam = env.IPINFO_TOKEN ? `?token=${env.IPINFO_TOKEN}` : '';
        const response = await axios.get(`https://ipinfo.io/AS${cleanAsn}/json${tokenParam}`);
        
        const asnString = response.data.asn ? response.data.asn.replace('AS', '') : cleanAsn;
        const data = {
            asn: asnString,
            name: response.data.name || 'Unknown',
            country: response.data.country || 'Unknown'
        };
        
        cache.set(`asn_${cleanAsn}`, data);
        setTimeout(() => cache.delete(`asn_${cleanAsn}`), 600000).unref(); // 10 min TTL
        return data;
    } catch (err) {
        console.error('IPInfo API Error:', err.response?.status, err.response?.data || err.message);
        throw new Error('Failed to fetch ASN data: ' + (err.response?.data?.error?.message || err.message));
    }
}

module.exports = { lookupASN };
