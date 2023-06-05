let clientConfig = require('./config.json').clientData;
let crmConfig = require('./config.json').crm;

const axios = require('axios');


async function getAccessToken(source) {
    let refreshToken;
    if (source == "crm") {
        refreshToken = crmConfig.refreshToken;
    }
    refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientConfig.clientId}&client_secret=${clientConfig.clientSecret}&grant_type=refresh_token`
    let response = await axios.post(refreshUrl);
    if (response.status == 200) {
        return response.data.access_token;
    }
    return false;
}


module.exports = { getAccessToken }