import { OpenAI_SECRET_KEY } from '../../config/index.js'; // Ensure this path is correct
import OpenAI from 'openai';

var KEY = OpenAI_SECRET_KEY; // Ensure this key is correct
const openai = new OpenAI({
  apiKey: KEY, // This is the default and can be omitted
});

async function generateReview(businessDescription,customReviewDetails,businessName,activeAI) {
  console.log("------",businessName,businessDescription,customReviewDetails)
  const prompt = `
  analze ${businessName} description and custom review details. assume you are a customer of this business now write what i say below as a customer .
  
    "Business Name": '${businessName}',
    "Business Description": '${businessDescription}',
    "Custom Review Details": [${customReviewDetails}] 
  


Please generate 5 reviews for each star rating (1 to 5 stars) for the above-mentioned business also include business type and its name in every review. Each review should be accompanied by a summary. Format the output as a JSON object with reviews categorized under each star rating.
1 Star review should also be decent and should only give positive review with scope of improvenent  (strict : only positive reviews if review is 1 or 2 then add that there is some scope of improvement or something else)
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
