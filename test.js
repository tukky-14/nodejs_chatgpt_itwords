const { Configuration, OpenAIApi } = require('openai');
const { personality } = require('./personality.js');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const target = 'HTML';

const fetch = async () => {
    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.3, // 生成テキストの多様性
        messages: [
            { role: 'system', content: personality },
            { role: 'user', content: `${target}教えて✨😆` },
        ],
    });
    console.log(
        'completion.data.choices[0].message.content,:',
        completion.data.choices[0].message.content
    );
};

fetch();
