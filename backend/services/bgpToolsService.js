const axios = require('axios');
const env = require('../config/env');
const cache = new Map();

/**
 * Detects if a string is a valid IPv4 or IPv6 address.
 */
function isIP(str) {
    const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
    const ipv6Regex = /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
}

async function lookup(query) {
    const cleanQuery = query.toString().trim();
    const cacheKey = `lookup_${cleanQuery.toLowerCase()}`;
    
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        const headers = {};
        if (env.IPINFO_TOKEN) {
            headers['Authorization'] = `Bearer ${env.IPINFO_TOKEN}`;
        }

        let url;
        if (isIP(cleanQuery)) {
            // Use IPinfo Lite for IP addresses
            url = `https://api.ipinfo.io/lite/${cleanQuery}`;
        } else {
            // Use standard ASN lookup for AS numbers
            const asn = cleanQuery.toUpperCase().replace('AS', '');
            url = `https://api.ipinfo.io/AS${asn}/json`;
        }

        const response = await axios.get(url, { headers });
        const data = response.data;
        
        // Normalize response to match existing UI
        const normalized = {
            asn: data.asn ? data.asn.replace('AS', '') : (isIP(cleanQuery) ? 'N/A' : cleanQuery),
            name: data.as_name || data.name || 'Unknown',
            country: data.country || data.country_code || 'Unknown',
            ip: data.ip || null,
            domain: data.as_domain || data.domain || null
        };

        cache.set(cacheKey, normalized);
        setTimeout(() => cache.delete(cacheKey), 600000).unref(); // 10 min TTL
        return normalized;
    } catch (err) {
        console.error('IPInfo API Error:', err.response?.status, err.response?.data || err.message);
        throw new Error('Failed to fetch intelligence data: ' + (err.response?.data?.error?.message || err.message));
    }
}

module.exports = { lookup };
