
const months = require('./config.json').months;


async function getCurrentDate() {
    const date = new Date();
    let dayUnf = date.getDate();
    let monthUnf = date.getMonth() + 1;
    let day = dayUnf < 10 ? "0" + dayUnf : dayUnf;
    let month = monthUnf < 10 ? "0" + monthUnf : monthUnf;
    //let monthFormatted = months[month];
    let year = date.getFullYear();
    return `${year}-${month}-${day}`;
    //return `${day}-${monthFormatted}-${year}`;

}


async function formatDate(date) {
    return 1;
}

async function getPostData(potentialId, collectedJobs) {
    let recordData = [];
    let currentDate = await getCurrentDate();
    console.log(currentDate);
    for (let job of collectedJobs) {
        let jobSource = job.source;
        let technologies = "";
        let postedDate = "";
        if (jobSource == "LinkedIn") {
            technologies = job.technologies;
            postedDate = job.postedDate;
        }
        let jobMap = {
            "Potential": potentialId,
            "Source": job.source,
            "Status": "Active",
            "Name": job.name,
            "Job_Url": job.url,
            "Publish_Date": postedDate,
            "Technologies": technologies
        };
        recordData.push(jobMap);
    }
    console.log(recordData);
    if (recordData.length > 0) {
        return { "data": recordData };
    } else {
        return false;
    }
}

module.exports = { getPostData };