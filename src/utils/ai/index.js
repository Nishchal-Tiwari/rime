import { OpenAI_SECRET_KEY } from '../../config/index.js'; // Ensure this path is correct
import OpenAI from 'openai';

var KEY = OpenAI_SECRET_KEY; // Ensure this key is correct
const openai = new OpenAI({
  apiKey: KEY, // This is the default and can be omitted
});

async function generateReview(businessDescription,customReviewDetails,businessName,activeAI) {
  const prompt = `
Business Name: '${businessName}'
Business Description: '${businessDescription}'
Custom Review Details: [${customReviewDetails}]

Please generate 5 reviews for each star rating (1 to 5 stars) for the above-mentioned business. Each review should be accompanied by a summary. Format the output as a JSON object with reviews categorized under each star rating.

Example:

{
  "1star": {
    "review1": {
      "summary": "Summary of 1-star review 1",
      "review": "Full text of 1-star review 1"
    },
    "review2": {
      "summary": "Summary of 1-star review 2",
      "review": "Full text of 1-star review 2"
    },
    // Add 3 more reviews for 1 star
  },
  "2star": {
  // Repeat the same structure for 2, 3, 4, and 5 stars
}
`;
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  });
  const res = chatCompletion.choices[0].message.content;
  console.log(JSON.parse(res));
  return JSON.parse(res);
}

export default generateReview;
