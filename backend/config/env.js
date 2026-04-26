module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_dev_key_2026',
    JWT_EXPIRY: '8h',
    IPINFO_TOKEN: process.env.IPINFO_TOKEN || '',
    PRIMARY_PING_TARGET: process.env.PRIMARY_PING_TARGET || '8.8.8.8'
};
