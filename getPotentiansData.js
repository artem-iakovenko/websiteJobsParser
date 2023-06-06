const axios = require('axios');

let refreshToken = "1000.7a08037367f95ce62c404e74c98b77e1.a08ba9ce40b27156cbcaa66240d199e0";
let clientId = "1000.T5VGK6CRDD7W6W8MO9QPZD6ZIF3TSG";
let clientSecret = "087ee51ba48ed0ce72294457d025eba49db635bb1e";
let cvId = "1576533000235584453";

async function getData() {
    token = await getAccessToken();
    if(token !== false) {
        data = await getPotentials(token);
        console.log(data);
        //potentialObj = await getPotentialInfo(token, "1576533000055042002");
        //console.log(potentialObj);
    }
}

async function getAccessToken() {
    refreshUrl = "https://accounts.zoho.com/oauth/v2/token?refresh_token=" + refreshToken + "&client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=refresh_token";
    let response = await axios.post(refreshUrl);

    if (response.status == 200) {
        return response.data.access_token;
    }
    return false;
}

async function getPotentials(accessToken) {

    const config = {
        headers: {
            "Authorization": "Zoho-oauthtoken " + accessToken
        }
    };

    /*let page = 1;
    let potentialUrl = "https://www.zohoapis.com/crm/v3/Potentials?cvid=" + cvId + "&per_page=20&page=" + page;
    let response = await axios.get(potentialUrl, config);
    let pageData = response.data.data;
    console.log(pageData);*/

    let allPotentials = [];
    let potentialJobJsons = [];
    let page = 1;
    while (true) {
        let pageData = [];
        try {
            let potentialUrl = "https://www.zohoapis.com/crm/v3/Potentials?cvid=" + cvId + "&per_page=200&page=" + page;
            let response = await axios.get(potentialUrl, config);
            let pageData = response.data.data;
            allPotentials.push.apply(allPotentials, pageData);
        } catch (e) {
            pageData = [];
            console.log(e);
        }
        if (pageData.length < 200) {
            break;
        }
        page += 1;
    }

    console.log("Total number of potentials: " + allPotentials.length);
    
    for(let potential of allPotentials) {
        let potentialJobJson = await getPotentialInfo(accessToken, potential.id);
        console.log(potentialJobJson);
        potentialJobJsons.push(potentialJobJson);
        console.log("***************");
    }

    data = {
        "accountsData": potentialJobJsons
    };

    console.log("================");
    console.log("================");


    console.log("Size of list in JSON: " + potentialJobJsons.length);

    return data;
}

async function getPotentialInfo(accessToken, potentialId) {
    let potentialsUrlByID = "https://www.zohoapis.com/crm/v2/Deals/" + potentialId;

    const config = {
        headers: {
            "Authorization": "Zoho-oauthtoken " + accessToken
        }
    };

    let resObj = {};

    try {
        let response = await axios.get(potentialsUrlByID, config);
        //console.log(response);
        potentialData = response.data.data[0];

        let careersUrl = potentialData.Careers_URL;
        let fetchType = potentialData.Fetch_Type;
        let linkKey = potentialData.Link_Key;
        let titleKey = potentialData.Title_Key;
        let accountLinkedIn = false;

        let account = potentialData.Account_Name;
        if(account !== null) {
            accountLinkedIn = await getAccountLinkedIn(accessToken, account.id);
            resObj["accountLinkedIn"] = accountLinkedIn;
        } 

        resObj["potentialId"] = potentialId;
        resObj["careersUrl"] = careersUrl;

        
        if(fetchType !== null && fetchType !== "") {

            if(fetchType.toLowerCase() !== "custom" && fetchType.toLowerCase() !== "unknown") {
                if(titleKey === null) {
                    titleKey = false;
                }
    
                resObj["linkKey"] = linkKey;
                resObj["titleKey"] = titleKey;
            }

            if(fetchType.toLowerCase() !== "unknown") {
                resObj["fetchType"] = fetchType;
            }

            if(fetchType.toLowerCase() === "indeed") {
                resObj["linkKey"] = "a[class*='JobTitle']";
                resObj["titleKey"] = "span";
            }

            if(fetchType.toLowerCase() === "block") {
                resObj["elementKey"] = potentialData.Block_Key;
            }

            if(fetchType.toLowerCase() === "custom") {
                resObj["approachId"] = potentialData.Approach_ID;
            }
        }
        
    } catch (e) {
        console.log(e);
        resObj = {};
    }

    return resObj;

}

async function getAccountLinkedIn(accessToken, accountId) {
    let accountUrlByID = "https://www.zohoapis.com/crm/v2/Accounts/" + accountId;

    let accountLinkedIn = false;

    const config = {
        headers: {
            "Authorization": "Zoho-oauthtoken " + accessToken
        }
    };

    try {
        let response = await axios.get(accountUrlByID, config);
        //console.log(response);
        accountData = response.data.data[0];
        accountLinkedIn = accountData.Account_LinkedIn_Url;

        if(accountLinkedIn === null) {
            accountLinkedIn = false;
        }
    } catch (e) {
        //console.log(e);
        accountLinkedIn = false;
    }

    return accountLinkedIn;
}

(async() => {
    await getData();
})();