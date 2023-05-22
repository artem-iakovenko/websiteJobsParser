const { default: puppeteer } = require('puppeteer');
const config = require('./config.json');


async function clearifyTitle(title) {
    try {
        let newTitle = title.replace(/\s\s+/g, ' ');
        if (newTitle[0] == ' ') {
            newTitle = newTitle.replace(' ', '');
        }
        return newTitle;

    } catch (e) {
        return title;
    }
}


async function filterJobs(entriesToFilter) {
    let filteredJobs = [];
    for (let entry of entriesToFilter) {
        for (let keyword of config.jobKeywords) {
            if (entry.name.toLowerCase().includes(keyword)) {
                filteredJobs.push(entry);
                break;
            }
        }
    }
    return filteredJobs;
}


async function fetchByLinks(page, customer) {
    let linkElements = await page.$$(customer.linkKey);
    let fetchedByLink = [];
    for (let linkElement of linkElements) {
        let jobUrl = await page.evaluate(el => el.href, linkElement) == '' ? customer.careersUrl : await page.evaluate(el => el.href, linkElement);
        let jobName;
        if (customer.titleKey) {
            jobName = await linkElement.$eval(customer.titleKey, el => el.innerText);

        } else {
            jobName = await page.evaluate(el => el.innerText, linkElement);
        }
        fetchedByLink.push({
            "name": await clearifyTitle(jobName),
            "url": jobUrl
        });
    }
    return fetchedByLink;
}


async function fetchCustom(page, customer) {
    let fetchedCustom = [];
    if (customer.approachId == "1") {
        let divElements = await page.$$('.position-cards-container .card');
        for (let divElement of divElements) {
            let jobName = await divElement.$eval('.position-title', el => el.innerText);
            await divElement.click();
            await page.waitForTimeout(10000);
            let jobUrl = await page.url();
            fetchedCustom.push({
                "name": await clearifyTitle(jobName),
                "url": jobUrl
            });
        }
    } else if (customer.approachId == "2") {
        let cards = await page.$$('#myJob card');
        for (let card of cards) {
            let divStyle = await card.$eval("div", el => el.getAttribute("style"));
            if (divStyle == "display: none;") {
                continue;
            }
            let jobUrl = await card.$eval('[href*="/position/"]', el => el.href);
            let jobName = await card.$eval('span', el => el.innerText);
            fetchedCustom.push({
                "name": await clearifyTitle(jobName),
                "url": jobUrl
            });
        }
    } else if (customer.approachId == "3") {
        let elementHandle = await page.$('#personio-iframe');
        let frameData = await elementHandle.contentFrame();
        let frameLinks = await frameData.$$eval("[href*='timify.jobs.personio.com/job/']", els => els.map(el => el.href));
        let framteTitles = await frameData.$$eval("[href*='timify.jobs.personio.com/job/'] .jb-title", els => els.map(el => el.innerText));
        let counter = 0;
        for (let frameLink of frameLinks) {
            fetchedCustom.push({
                "name": await clearifyTitle(framteTitles[counter]),
                "url": frameLink
            });
            counter += 1;
        }
    } else if (customer.approachId == "4") {
        let jobUrls = await page.$$eval('[href*="pdf"]', els => els.map(el => el.href));
        let jobNames = await page.$$eval('[style="font-weight:bold;"]', els => els.map(el => el.innerText));
        let counter = 0;
        for (let jobUrl of jobUrls) {
            fetchedCustom.push({
                "name": await clearifyTitle(jobNames[counter]),
                "url": jobUrl
            });
            counter += 1;
        }
    }
    return fetchedCustom;
}


async function fetchByDiv(page, customer) {
    let fetchedByDiv = [];
    let divElements = await page.$$(customer.elementKey);
    for (let divElement of divElements) {
        let jobName = await divElement.$eval(customer.titleKey , el => el.innerText);
        let jobUrl = await divElement.$eval(customer.linkKey , el => el.href);
        fetchedByDiv.push({
            "name": await clearifyTitle(jobName),
            "url": jobUrl
        });
    }
    return fetchedByDiv;
}


async function fetchBySearch(page, customer) {
    let fetchedBySearch = [];
    let keywords = config.jobKeywords;
    for (let keyword of keywords) {
        await page.goto(`${customer.careersUrl}${keyword}`, { 'timeout': 50000, 'waitUntil': 'load' });
        await page.waitForTimeout(10000);
        let searchResults = await fetchByLinks(page, customer);
        fetchedBySearch.push(...searchResults);
    }
    return fetchedBySearch;
}


async function fetchIndeed(page, customer) {
    let linkElements = await page.$$(customer.linkKey);
    let fetchedIndeed = [];
    for (let linkElement of linkElements) {
        let jobName = await linkElement.$eval(customer.titleKey , el => el.innerText);
        let dk = await page.evaluate(el => el.getAttribute("data-jk"), linkElement);
        let jobUrl = `https://www.indeed.com/cmp/Freightcenter-Inc/jobs?jk=${dk}&start=0`
        fetchedIndeed.push({
            "name": await clearifyTitle(jobName),
            "url": jobUrl
        });
    }
    return fetchedIndeed;
}


async function accountHandler(page, customer) {
    await page.goto(customer.careersUrl, { 'timeout': 50000, 'waitUntil': 'load' });
    await page.waitForTimeout(5000);
    let allJobs = [];
    let filteredJobs = [];
    let isFetchType = customer.hasOwnProperty("fetchType");
    if (!isFetchType) {
        allJobs = await fetchByLinks(page, {"linkKey": "a", "titleKey": false});
        //return filteredJobs;
    }
    if (customer.fetchType == "link") {
        allJobs = await fetchByLinks(page, customer);
    } else if (customer.fetchType == "div") {
        allJobs = await fetchByDiv(page, customer);
    } else if (customer.fetchType == "custom") {
        allJobs = await fetchCustom(page, customer);
    } else if (customer.fetchType == "search") {
        allJobs = await fetchBySearch(page, customer);
    } else if (customer.fetchType == "indeed") {
        allJobs = await fetchIndeed(page, customer);
    }
    if (allJobs.length > 0) {
        filteredJobs = await filterJobs(allJobs);
    }
    return filteredJobs;
}


(async() => {
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--start-maximized'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768,
      });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
    let customerCounter = 1;
    for (let customer of config.accountsData) {
        let status;
        console.log(`${customerCounter}. ${customer.careersUrl}`)
        try {
            let relevantJobs = await accountHandler(page, customer);
            console.log(relevantJobs);
            status = 'Success';
        } catch (e) {
            console.log(e);
            status = 'Failure';
        }
        console.log(`Status: ${status}`);
        console.log('-------------------------------');
        customerCounter += 1;
    }
    await browser.close();
})();