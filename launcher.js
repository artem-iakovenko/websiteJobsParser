const { default: puppeteer } = require('puppeteer');
const config = require('./config.json');
//const accountsData = require('./accountsData.json').accountsData;

const linkedin = require('./linkedin.js');
const readline = require('readline-sync');
const website = require('./website.js');
const dataPreparator = require('./getPostData.js');
const crm = require('./crmHandler.js');
var fs = require("fs");


async function launch() {
    let accountsData = await crm.getInputJson();
    fs.writeFile("./accountsData.json", JSON.stringify({"accountsData": accountsData}, null, 4), (err) => {
        if (err) {  console.error(err);  return; };
        console.log("File has been created");
    });
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--start-maximized'
        ],
        userDataDir: 'ChromeData'
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768,
    });
    await page.setUserAgent(config.userAgent);
    let customerCounter = 1;
    let postData = [];
    for (let customer of accountsData) {
        console.log(customer);
        let potentialId = customer.potentialId;
        let status;
        console.log(`${customerCounter}. ${customer.potentialId}`);
        let websiteJobs = [];
        let linkedinJobs = [];
        try {
            try {
                websiteJobs = await website.websiteHandler(page, customer);
            } catch (e) {
                console.log(e);
                console.log("Error Happened while collecting JOBS from Website");
            }
            try {
                linkedinJobs = await linkedin.linkedinHandler(page, customer.accountLinkedIn);
            } catch (e) {
                console.log("Error Happened while collecting JOBS from LinkedIn");
            }
            status = 'Success';
        } catch (e) {
            console.log(e);
            status = 'Failure';
        }
        let allJobs = websiteJobs.concat(linkedinJobs);
        let createJobsData = await dataPreparator.getPostData(potentialId, allJobs);
        if (createJobsData) {
            let createStatus = await crm.createJobs(createJobsData);
            console.log(`Create Status: ${createStatus}`);
            console.log('-------------------------------');
        }
        customerCounter += 1;
        //readline.question("Move to next company?\n");
        await page.waitForTimeout(5000);
    }
    await browser.close();

};

//module.exports = { launch };
 launch();