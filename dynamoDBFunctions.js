const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'ap-northeast-1' });
const dayjs = require('dayjs');

/**
 * DynamoDBに会話履歴を保存
 * @param {*} userId
 * @param {*} timestamp
 * @param {*} message
 * @param {*} replyMessage
 */
exports.putMessageHistory = async (userId, timestamp, message, replyMessage) => {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const params = {
        TableName: 'baby_chat_history',
        Item: {
            user_id: { S: userId },
            timestamp: { N: timestamp.toString() },
            message: { S: message },
            reply_message: { S: replyMessage },
            created_at: { N: now },
        },
    };
    console.log('params:', params);

    await dynamodb.putItem(params, function (err, data) {
        if (err) {
            console.error('Unable to put item. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            console.log('PutItem succeeded:', JSON.stringify(data, null, 2));
        }
    });
};

/**
 * DynamoDBから直近5回の会話を取得
 * @param {*} userId
 */
exports.getMessageHistory = async (userId) => {
    const params = {
        TableName: 'baby_chat_history',
        KeyConditionExpression: 'user_id = :user_id',
        ExpressionAttributeValues: {
            ':user_id': { S: userId },
        },
        ScanIndexForward: false,
        Limit: 5,
    };

    const data = await dynamodb.query(params).promise();
    console.log('data:', data);

    const pastMessages = data.Items.sort((a, b) => {
        return a.timestamp.N - b.timestamp.N;
    }).map((item) => {
        return {
            message: item.message.S,
            replyMessage: item.reply_message.S,
        };
    });

    const pastMessageArray = [];
    pastMessages.forEach((pastMessage) => {
        pastMessageArray.push({ role: 'user', content: pastMessage.message });
        pastMessageArray.push({ role: 'assistant', content: pastMessage.replyMessage });
    });

    return pastMessageArray;
};
