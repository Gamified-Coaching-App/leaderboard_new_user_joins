import https from 'https';

export async function triggerChallengesNewUserGeneration(userId) {
    console.log(`Triggering challenge generation for new user: ${userId}`);

    const challengesApiUrl = 'https://jkipopyatb.execute-api.eu-west-2.amazonaws.com/dev/challenge-creation-new-user';

    // Prepare the payload
    const apiPayload = {
        user_id: userId, 
        season_id: `new_user_season`
    };

    // Convert the payload to a string
    const dataString = JSON.stringify(apiPayload);

    // Define the options for the HTTPS request
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString),
        },
    };

    // Return a new Promise that resolves or rejects based on the API call outcome
    return new Promise((resolve, reject) => {
        const req = https.request(challengesApiUrl, options, (res) => {
            let response = '';

            res.on('data', (chunk) => {
                response += chunk;
            });

            res.on('end', () => {
                console.log("Response from challenges_new_user_generation:", response);
                resolve(response); // Resolve the promise with the response
            });
        });

        req.on('error', (e) => {
            console.error("Error calling challenges_new_user_generation:", e);
            reject(e); // Reject the promise on error
        });

        // Send the request with the payload
        req.write(dataString);
        req.end();
    });
}