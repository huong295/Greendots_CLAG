const { type } = require('os');
const campaign = require('../models/campaign.m')
const trash = require('../models/trash.m')


module.exports = {
    searchCampaign: async (req, res) => {

    },

    // read all campaigns
    readAll: async (req, res) => {
        campaign.getAllCampaigns()
                .then(result => res.send(JSON.stringify(result)))
                .catch(err => res.send({message: err.message}))
    },

    // create a new campaign
    createCampaign: async (req, res) => {
        try {
            // preprocess 
            // {startDate, endDate, description, campaignName, openHour, closeHour, address, receiveItems}
            var campaignData = {...req.body};
            // start day < end day
            // Check if startDate is less than endDate
            const today = new Date();
            const start = new Date(campaignData.startDate);
            const end = new Date(campaignData.endDate);
    
            if (start > end) {
                res.send({ success: false, message: 'Start date must be less than end date' });
                return;
            }

            // check name
            campaignData['campaignName'] = campaignData['campaignName'].trim().replace("'", "''");
            if (campaignData['campaignName'] && campaignData['campaignName'].length < 1) {
                res.send({
                    success: false,
                    message: 'Name must be filled',
                })
                return;
            }

            if (!campaignData['lat'] || !campaignData['long']) {
                res.send({
                    success: false,
                    message: 'Must have lattitude and longtitude',
                });
                return;
            }
    
            // set status
            campaignData['status'] = start > today ? 2 : (end < today ? 0 : 1)
            // split address
            const [street, ward, district, province, country] = 
                                [...campaignData['address'].split(', ')];
            campaignData = {
                ...campaignData,
                street, ward, district, province, country
            }
            const itemsInCampaign = await Promise.all(campaignData.receiveItems.map(async(val) => {
                if (typeof val == 'string') {
                    const trashID = await trash.postNewTrash(val);
                    return trashID;
                }
                return val;
            }));

            const campaignID = campaign.createCampaign(campaignData)
                    .then(campaignID => {
                        campaign.createCampaignItem(campaignID, itemsInCampaign)
                                .then(() => {
                                    res.send({
                                        success: true
                                    })
                                })
                                .catch(err => res.send({message: err.message}));
                    })
                    .catch(err => {
                        res.send({message: err.message})
                    })

        } catch (err) {
            res.send({
                success: false,
                message: err.message,
            })
        }
    },

    // edit campaign
    editCampaign: async (req, res) => {
        const campaignData = {...req.body};

        campaign.updateCampaign(campaignData)
                .then(result => res.send({success: true}))
                .catch(err => res.send({message: err.message}))
    },

    // delete a campaign
    deleteCampaign: async (req, res) => {
        // TODO: check if the request comes from the organizer of the campaign 
        campaign.deleteCampaign(req.body.campaignID)
                .then(result => res.send({success: true}))
                .catch(err => res.send({message: err.message}))
    },
}