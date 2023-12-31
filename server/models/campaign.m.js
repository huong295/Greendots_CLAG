const db = require('../config/connectDB')


module.exports = {

    // create a new campaign // dang cho doi lai DB 
    createCampaign: async(campaignData) => {
        try {
            const result = await db.Query(`
                INSERT INTO Campaign (CampaignName, StartDate, EndDate, Address, Lat, \`Long\`, Description, Status, OpenHour, CloseHour)
                VALUES ('${campaignData.campaignName}', 
                        '${campaignData.startDate}', 
                        '${campaignData.endDate}', 
                        ${campaignData.address ? `'${campaignData.address}'` : 'NULL'}, 
                        ${campaignData.lat ? campaignData.lat : 'NULL'},
                        ${campaignData.long ? campaignData.long : 'NULL'},
                        ${campaignData.description ? `'${campaignData.description}'` : 'NULL'},
                        ${campaignData.status},
                        '${campaignData.openHour}',
                        '${campaignData.closeHour}')
                `) /// them lat, lon nua
            return result.insertId;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // create relationship between campaign and trash item
    createCampaignItem: async(campaignID, campaignItems) => {
        try {
            const values = campaignItems.map((itemID) => `(${campaignID}, ${itemID})`)
            const result = db.Query(`
                INSERT INTO Recycling (CampaignID, ItemID)
                VALUES ${values.join(', ')}
            `)
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // edit a campaign
    updateCampaign: async(campaignData) => {
        try {
            const result = db.Query(`
                UPDATE Campaign
                SET 
                    CampaignName = ${typeof campaignData.campaignName === 'undefined' ? 'CampaignName' : `'${campaignData.campaignName}'`},
                    StartDate    = ${typeof campaignData.startDate === 'undefined' ? 'StartDate' : `'${campaignData.startDate}'`},
                    EndDate      = ${typeof campaignData.endDate === 'undefined' ? 'EndDate' : `'${campaignData.endDate}'`},
                    Address      = ${typeof campaignData.address === 'undefined' ? 'Address' : `'${campaignData.address}'`},
                    Lat          = ${typeof campaignData.lat === 'undefined' ? 'Lat' : campaignData.lat},
                    \`Long\`     = ${typeof campaignData.country === 'undefined' ? 'Long' : campaignData.long},
                    Description  = ${typeof campaignData.description === 'undefined' ? 'Description' : `'${campaignData.description}'`},
                    Status       = ${typeof campaignData.status === 'undefined' ? 'Status' : campaignData.status},
                    OpenHour     = ${typeof campaignData.openHour === 'undefined' ? 'OpenHour' : `'${campaignData.openHour}'`},
                    CloseHour    = ${typeof campaignData.closeHour === 'undefined' ? 'CloseHour' : `'${campaignData.closeHour}'`}
                WHERE CampaignID = ${campaignData.campaignID};
            `).then((result) => {
                console.log(result);
            })
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // delete a campaign 
    deleteCampaign: async(campaignID, userID) => {
        try {
            const result = await db.Query(`
                DELETE FROM Campaign 
                WHERE CampaignID = ${campaignID}
            `).then((result) => console.log(result))
        } catch (err) {
            console.log(err)
            throw err;
        }
    },

    // read all campaigns
    getAllCampaigns: async() => {
        try {
            const results = await db.Query(`
                    SELECT
                        C.campaignID, campaignName,
                        O.organizerID, O.Name AS organizerName,
                        startDate, endDate,
                        openHour, closeHour,
                        lat, \`long\`,
                        C.address,
                        C.description,
                        ROUND(IFNULL((
                            SELECT AVG(rating)
                            FROM review
                            WHERE campaignID = C.campaignID
                        ), 0), 1) AS averageRating
                    FROM
                    Campaign C
                    JOIN Organizing ON C.CampaignID = Organizing.CampaignID
                    JOIN Organizer O ON O.OrganizerID = Organizing.OrganizerID;
                `)
            return results;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // search campaign by id 
    getCampaignByID: async(campaignID) => {
        try {
            const results = await db.Query(`
                    SELECT 
                        C.campaignID, campaignName,
                        Name AS organizerName,
                        startDate, endDate,
                        openHour, closeHour, 
                        lat, \`long\`,
                        address,
                        C.description
                    FROM 
                        Campaign C
                        JOIN Organizing ON C.CampaignID = Organizing.CampaignID
                        JOIN Organizer ON Organizing.OrganizerID = Organizer.OrganizerID
                    WHERE 
                        C.CampaignID = ${campaignID}
            `)
            return results;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // search campaign by city and is active or upcoming
    getCampaignsByDateRange: async(startDate, endDate, topK=50) => {
        try {
            const results = await db.Query(`
                SELECT campaignID
                FROM campaign
                WHERE endDate >= '${startDate}'
                      AND startDate <= '${endDate}'
                ORDER BY startDate ASC
                LIMIT ${topK};
            `)
            return results;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    // search campaign by Haversine distance 
    getCampaignsByDistance: async (targetedLattitude, targetedLongtitude, startDate, endDate, topK=5) => {
        try {
            const results = await db.Query(`
                SELECT campaignID,
                    (
                        6371 * 
                        acos(
                        cos(radians(${targetedLattitude})) * cos(radians(lat)) * cos(radians(\`long\`) - radians(${targetedLongtitude})) +
                        sin(radians(${targetedLattitude})) * sin(radians(lat))
                        )
                    ) AS distance
                FROM campaign
                WHERE endDate >= '${startDate}'
                      AND startDate <= '${endDate}'
                ORDER BY distance ASC, startDate ASC
                LIMIT ${topK};
            `)
            return results;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

}