// import { IncomingWebhook } from "@slack/webhook";
const {IncomingWebhook} = require("@slack/webhook");
module.exports = slackLog = async (
    moduleName,
    data,
    type = 'error'
) => {
    try {
        const wh = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL ?? "");
        // const isDev = process.env.ENV === 'DEV';

        // if (isDev) `errors-ecom-csd-mre`;
        console.log("HH");
        
        const channelName = process.env.SLACK_CHANNEL_NAME;
        const body = JSON.stringify(data);
        await wh.send({
            // channel: channelName,
            blocks: [
                {
                    type: "divider"
                },
                {
                    type: "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Module -> ${moduleName}* \n *MessageType: -> ${type}*`
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": body
                    }
                },
                {
                    type: "divider"
                }
            ],
        });
        return true
    } catch (err) {
        console.error('Error sending to Slack:', err.response?.data || err);
        return true
    }
}

