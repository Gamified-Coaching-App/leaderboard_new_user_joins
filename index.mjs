import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    // cognito trigger/trigger from update in user_id db

    // new entry created in DB. 
    // all entries except username set to null or zero. MIGHT NEED TO CHANGE LOGIC FOR ADDING SCORE IN leaderboard_read_event_update_leaderboard



    return;
}
