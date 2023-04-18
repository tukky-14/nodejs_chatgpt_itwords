const { Configuration, OpenAIApi } = require('openai');
const { personality } = require('./personality.js');
const { getMessageHistory, putMessageHistory } = require('./dynamoDBFunctions.js');
const line = require('@line/bot-sdk');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = new line.Client({
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
});

exports.handler = async (event) => {
    console.log('event:', JSON.stringify(event));

    const message = event.events[0].message.text;
    const userId = event.events[0].source.userId;
    const timestamp = event.events[0].timestamp;
    const replyToken = event.events[0].replyToken;

    // DynamoDBから直近5回の会話を取得
    const pastMessages = await getMessageHistory(userId);
    console.log('pastMessages:', pastMessages);

    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.5, // 生成テキストの多様性
        maxTokens: 2048, // 生成テキストの長さ
        messages: [
            { role: 'system', content: personality },
            ...pastMessages,
            { role: 'user', content: message },
        ],
    });

    const replyMessage = {
        type: 'text',
        text: completion.data.choices[0].message.content,
    };

    // DynamoDBに会話を保存
    await putMessageHistory(userId, timestamp, message, replyMessage.text);

    // LINEに返信
    await client.replyMessage(replyToken, replyMessage);

    return {
        statusCode: 200,
        body: JSON.stringify('Message sent.'),
    };
};
