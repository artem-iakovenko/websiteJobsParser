const axios = require('axios');
const token = require('./token.js');
const crmConfig = require('./config.json').crm;
let requestConfig;

async function formatLinkeinUrl(url) {
    try {
        url = url.replace("/about/", "");
        if (url[url.length - 1] == "/") {
            url = url.substring(0, url.length - 1);
        }
        return `${url}/jobs/`
    } catch (e) {
        return null;
    }

}

async function getAccountLinkedIn(accountId) {
    let accountUrlByID = `${crmConfig.accountsUrl}${accountId}`
    let response = await axios.get(accountUrlByID, requestConfig);
    let accountData = response.data.data[0];
    let accountLinkedIn = accountData.Account_LinkedIn_Url;
    if (accountLinkedIn !== null) {
        return await formatLinkeinUrl(accountLinkedIn);
    } else {
        return accountLinkedIn;
    }
}

async function getPotentialInfo(potentialId) {
    let potentialsUrlByID = `${crmConfig.potentialsUrl}${potentialId}`;
    let resObj = {};
    let response = await axios.get(potentialsUrlByID, requestConfig);
    let potentialData = response.data.data[0];
    let careersUrl = potentialData.Careers_URL;
    let fetchType = potentialData.Fetch_Type;
    let linkKey = potentialData.Link_Key;
    let titleKey = potentialData.Title_Key;
    let blockKey = potentialData.Block_Key;
    let accountLinkedIn = false;
    let account = potentialData.Account_Name;
    if (account !== null) {
        accountLinkedIn = await getAccountLinkedIn(account.id);
        resObj["accountLinkedIn"] = accountLinkedIn;
    }
    if (careersUrl === null) {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl };
    }
    else if (fetchType == "Link") {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "linkKey": linkKey, "titleKey": titleKey, "fetchType": fetchType };
    } else if (fetchType == "Block") {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "blockKey": blockKey, "linkKey": linkKey, "titleKey": titleKey, "fetchType": fetchType };
    } else if (fetchType == "Indeed") {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "blockKey": blockKey, "linkKey": "a[class*='JobTitle']", "titleKey": "span", "fetchType": fetchType };
    } else if (fetchType == "Custom") {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "approachId": potentialData.Approach_ID, "fetchType": fetchType };
    } else if (fetchType == "Search") {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "linkKey": linkKey, "titleKey": titleKey, "fetchType": fetchType };
    } else {
        resObj = { "potentialId": potentialId, "accountLinkedIn": accountLinkedIn, "careersUrl": careersUrl, "fetchType": fetchType };
    }
    console.log(resObj);
    return resObj;
}


async function getInputJson() {
    requestConfig = { headers: { "Authorization": `Zoho-oauthtoken ${await token.getAccessToken('crm')}` } };
    let allPotentials = [];
    let potentialJobJsons = [];
    let page = 1;
    while (true) {
        let pageData = [];
        try {
            let potentialUrl = `${crmConfig.potentialsCvUrl}${crmConfig.cvid}&per_page=200&page=${page}`;
            let response = await axios.get(potentialUrl, requestConfig);
            let pageData = response.data.data;
            allPotentials.push.apply(allPotentials, pageData);
        } catch (e) {
            pageData = [];
        }
        if (pageData.length < 200) {
            break;
        }
        page += 1;
    }
    for (let potential of allPotentials) {
        let potentialJobJson = await getPotentialInfo(potential.id);
        potentialJobJsons.push(potentialJobJson);
    }
    return potentialJobJsons;
}



async function createJobs(data) {
    requestConfig = { headers: { "Authorization": `Zoho-oauthtoken ${await token.getAccessToken('crm')}` } };
    let response = await axios.post(crmConfig.addJobsUrl, data, requestConfig);
    console.log(response.data);
    return response.status;
}


module.exports = { createJobs, getInputJson };