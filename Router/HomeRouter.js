require("dotenv").config();
const express = require('express');
const HomeRouter = express.Router();
const bcryptjs = require('bcryptjs');
const AdminModel = require('../Models/AdminModel');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const SECRET_KEY = process.env.SECRET_KEY;
const ConsumerModel = require('../Models/ConsumerModel');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const SavingModel = require('../Models/SavingModel');
const AgentModel = require('../Models/AgentModel');
const newRenuwalSavingModel = require('../Models/RenuwalSaving')


//consumer image upload route
const consumerimage = new CloudinaryStorage({

    cloudinary: cloudinary,

    params: {
        folder: "consumers",
        allowed_formats: ["jpg", "png", "jpeg"]
    }

});

//route define for the consumer image upload
const consumerimg = multer({ storage: consumerimage });


//create admin api
HomeRouter.post('/create-admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(401).json({ msg: "Username & Password required !" })
        }

        const sartRound = 10;

        const newPass = await bcryptjs.hash(password, sartRound);

        const newAdmin = new AdminModel({ username, password: newPass });
        await newAdmin.save();
        return res.status(201).json({ msg: "Admin added successfully !" });
    } catch (error) {
        console.error(`Error from the ${error}`)
    }
})


//admin login api
HomeRouter.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(401).json({ msg: "Username & Password required !" })
        }

        const is_valid_user = await AdminModel.findOne({ username: username });
        if (!is_valid_user) {
            return res.status(404).json({ msg: "User not exist" });
        }

        //if user name is valid then 

        const compare_Pass = await bcryptjs.compare(password, is_valid_user.password);

        if (!compare_Pass) {
            return res.status(401).json({ msg: "Invalid password" })
        }

        let jwttoken = jwt.sign({ username: is_valid_user.username }, SECRET_KEY, { expiresIn: "7d" });

        return res.status(200).json({ msg: "Admin login successfully !", token: jwttoken })


    } catch (error) {
        console.error(`Error from the admin lgin route ${error}`);
    }
})


//add conusmer
HomeRouter.post('/add-consumer', consumerimg.single('photo'), async (req, res) => {
    try {
        console.log("FILE DATA:", req.file);
        const {
            name, father, dob, age, gender, merital, phone, email,
            aadhar, pan, nationality, present_address, city, state,
            pincode, bank, accountholder, accountno, ifsc, branch,
            doa, nos, share_value, password
        } = req.body;


        const photo = req.file ? req.file.path : null;



        // Required Validation
        if (
            !name || !father || !dob || !age || !gender ||
            !merital || !phone || !email || !aadhar ||
            !pan || !nationality || !present_address ||
            !city || !state || !pincode || !bank ||
            !accountholder || !accountno || !ifsc ||
            !branch || !doa || !nos || !share_value || !password
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }



        // Duplicate Check

        const existConsumer = await ConsumerModel.findOne({
            $or: [
                { phone },
                { email },
                { aadhar },
                { pan }
            ]
        });


        if (existConsumer) {

            return res.status(400).json({
                success: false,
                message: "Phone, Email, Aadhar or PAN already exists"
            });

        }




        // Generate 10 Digit Membership Number

        let membership_no;

        do {

            membership_no = Math.floor(
                1000000000 + Math.random() * 9000000000
            );


        } while (
            await ConsumerModel.findOne({ membership_no })
        );





        // Insert Consumer Data

        const consumer = new ConsumerModel({

            membership_no,

            photo,

            name,
            father,
            dob,
            age,
            gender,
            merital,

            phone,
            email,

            aadhar,
            pan,

            nationality,

            present_address,
            city,
            state,
            pincode,

            bank,
            accountholder,
            accountno,
            ifsc,
            branch,

            doa,
            nos,
            share_value,
            password

        });



        await consumer.save();



        return res.status(201).json({

            success: true,
            message: "Consumer Added Successfully",
            membership_no: membership_no,
            data: consumer

        });



    } catch (error) {


        console.log("Add Consumer Error:", error);


        return res.status(500).json({

            success: false,
            message: "Server Error",
            error: error.message

        });

    }
});


//fetch all consumer lists
HomeRouter.get('/get-consumers', async (_, res) => {
    try {
        const consumer_exist = await ConsumerModel.find();

        if (!consumer_exist) {
            return res.status(404).json({ msg: "Consumer not exist" });
        }

        //if exist then 

        return res.status(200).json({ msg: "Consumer fetch successfully !", data: consumer_exist });

    } catch (error) {
        console.error(`Error from the fetch consumer list and error is the ${error}`);
    }
})


//open saving account 
HomeRouter.post('/open-saving-account', async (req, res) => {
    try {

        const {
            branch, membership_id, account_holder, father_husband, dob, gender,
            merital, occupation, phone, email, city, state, pincode, address,
            aadhar, pan, voter, initital_d, minimum_d, interest, opening_date,
            nominee_name, relation, n_dob, n_contact, a_name, a_code
        } = req.body;


        if (
            !branch || !membership_id || !account_holder ||
            !father_husband || !dob || !gender || !merital ||
            !occupation || !phone || !email || !city ||
            !state || !pincode || !address || !aadhar ||
            !pan || !voter || !initital_d || !minimum_d ||
            !interest || !opening_date || !nominee_name ||
            !relation || !n_dob || !n_contact ||
            !a_name || !a_code
        ) {

            return res.status(401).json({
                msg: "All fields is required"
            });

        }


        // check membership valid

        const check_member = await ConsumerModel.findOne({
            membership_no: membership_id
        });


        if (!check_member) {

            return res.status(404).json({
                msg: "Invalid Consumer ID"
            });

        }



        // Generate Unique Saving Number

        let saving_number;


        do {

            saving_number =
                Math.floor(1000000 + Math.random() * 9000000);


        } while (
            await SavingModel.findOne({ saving_number })
        );



        // Insert Saving Account


        const newSaving = new SavingModel({

            saving_number,

            branch,
            membership_id,

            account_holder,
            father_husband,

            dob,
            gender,
            merital,

            occupation,

            phone,
            email,

            city,
            state,
            pincode,

            address,

            aadhar,
            pan,
            voter,


            initital_d,
            minimum_d,
            interest,

            opening_date,


            nominee_name,
            relation,
            n_dob,
            n_contact,


            a_name,
            a_code

        });


        await newSaving.save();



        return res.status(201).json({

            msg: "Saving Account Open Successfully",

            saving_number: saving_number,

            data: newSaving

        });



    } catch (error) {

        console.log(error);

        return res.status(500).json({
            msg: "Server Error"
        });

    }
});


//fetch all saving accounts
HomeRouter.get('/all-saving-account', async (_, res) => {
    try {
        const saving_records = await SavingModel.find();

        if (!saving_records) {
            return res.status(404).json({ msg: "No Records found 1" })
        }

        return res.status(200).json({ msg: "Data fetched successfully !", data: saving_records })
    } catch (error) {
        console.error(`Error from the fetching saving account details and error is the ${error}`)
    }
})


//FETCH TOTAL ACCOUNT AND CONSUMER COUNYT
HomeRouter.get('/total-consumer-accounts', async (_, res) => {
    try {
        const allConsumer = await ConsumerModel.countDocuments();
        const allAccounts = await SavingModel.countDocuments();
        const allAgents = await AgentModel.countDocuments();

        return res.status(200).json({ msg: "Consumer and account dta fetched successfully !", consumer: allConsumer, accounts: allAccounts, agents: allAgents });
    } catch (error) {
        console.error(`Error from getting all consumers and account and error is the ${error}`)
    }
})


//add agent api
HomeRouter.post('/add-agent', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(401).json({ msg: "All fields is required !" });
        }

        // Check phone and email already exist
        const existingAgent = await AgentModel.findOne({
            $or: [
                { phone: phone },
                { email: email }
            ]
        });

        if (existingAgent) {
            return res.status(400).json({
                msg: "Phone or Email already exists!"
            });
        }


        // Generate unique 10 digit agent code
        let agentcode;
        let exists = true;

        while (exists) {

            agentcode = Math.floor(1000000000 + Math.random() * 9000000000);

            const checkCode = await AgentModel.findOne({ agentcode });

            if (!checkCode) {
                exists = false;
            }
        }


        const newAgent = new AgentModel({
            name,
            phone,
            email,
            password,
            agentcode
        });


        await newAgent.save();


        return res.status(201).json({
            msg: "Agent Added Successfully!",
            agentcode: agentcode
        });


    } catch (error) {

        console.error(`Error from add agent: ${error}`);

        return res.status(500).json({
            msg: "Server Error"
        });
    }
});


//fetch all agent api 
HomeRouter.get('/fetch-all-agents', async (_, res) => {
    try {
        const fetchALLagents = await AgentModel.find();

        if (!fetchALLagents) {
            return res.status(404).json({ msg: "No record found !" })
        }

        return res.status(200).json({ msg: "Agents fetched successfully !", data: fetchALLagents });
    } catch (error) {
        console.error(`Error from the fetch all agents api and error is the ${error}`)
    }
})


//fetch the agent or associate name with associate or agent id
HomeRouter.get('/fetch-agent/:agent_code', async (req, res) => {
    try {
        const { agent_code } = req.params

        if (!agent_code) {
            return res.status(401).json({ msg: "Agent code is required !" })
        }

        const check_agent_name = await AgentModel.findOne({ agentcode: agent_code });

        if (!check_agent_name) {
            return res.status(404).json({ msg: 'Invalid agent code ' })
        }

        return res.status(200).json({ msg: 'Agent fetched successfully !', name: check_agent_name.name });

    } catch (error) {
        console.error(`Error from the fetch consumer name ${error} is the error`)
    }
})


//fetch the holder phone and branch name based on the account number  
HomeRouter.get('/fetch-accounts/:accountno', async (req, res) => {
    try {
        const { accountno } = req.params;

        if (!accountno) {
            return res.status(401).json({ msg: "Account no is required !" })
        }

        const fetch_account_details = await SavingModel.findOne({ saving_number: accountno });

        if (!fetch_account_details) {
            return res.status(404).json({ msg: 'Invalid Account Number ' })
        }


        return res.status(200).json({ msg: "Details fetched successfully !", holder: fetch_account_details.account_holder, phone: fetch_account_details.phone, branch: fetch_account_details.branch });

    } catch (error) {
        console.error(`Error from fetching the account no and error is the ${error}`);
    }
})


// deposit saving account balence updated
HomeRouter.post('/renuwal-saving', async (req, res) => {
    try {
        const { accountno, holdername, phone, branch, deposit_amount, deposit_by } = req.body;

        if (!accountno || !holdername || !phone || !branch || !deposit_amount || !deposit_by) {
            return res.status(401).json({ msg: "All fields is required !" });
        }

        const newRenuwalSaving = new newRenuwalSavingModel({ accountno, holdername, phone, branch, deposit_amount, deposit_by });
        await newRenuwalSaving.save();

        return res.status(201).json({ msg: 'Renuwal Saving Successfully!' });

    } catch (error) {
        console.error(`Error from renuwal saving accounts and error is the ${error}`)
    }
})

//fetch all renuwal list add
HomeRouter.get('/fetch-all-renuwal-list', async (_, res) => {
    try {
        const getc_all_renuwal_lists = await newRenuwalSavingModel.find();

        if (!getc_all_renuwal_lists) {
            return res.status(404).json({ msg: "All fields is requireed !" });
        }

        return res.status(200).json({ msg: "Data fetched successfully !", data: getc_all_renuwal_lists });

    } catch (error) {
        console.error(`Error from getting renuwal listing and error is the ${error}`)
    }
})


// ✅ Fetch single consumer by ID
HomeRouter.get('/get-consumer/:id', async (req, res) => {
    try {
        const consumer = await ConsumerModel.findById(req.params.id);
        if (!consumer) return res.status(404).json({ msg: "Consumer not found" });
        return res.status(200).json({ msg: "Consumer fetched successfully!", data: consumer });
    } catch (error) {
        console.error("Get consumer error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Update consumer by ID
HomeRouter.put('/update-consumer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            name: req.body.name,
            father: req.body.father,
            dob: req.body.dob,
            age: req.body.age,
            gender: req.body.gender,
            merital: req.body.merital,
            phone: req.body.phone,
            email: req.body.email,
            aadhar: req.body.aadhar,
            pan: req.body.pan,
            nationality: req.body.nationality,
            present_address: req.body.present_address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            bank: req.body.bank,
            accountholder: req.body.accountholder,
            accountno: req.body.accountno,
            ifsc: req.body.ifsc,
            branch: req.body.branch,
            doa: req.body.doa,
            nos: req.body.nos,
            share_value: req.body.share_value,
        };

        // Photo update if uploaded
        if (req.file) {
            updateData.photo = req.file.path;
        }

        const updated = await ConsumerModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updated) return res.status(404).json({ msg: "Consumer not found" });

        return res.status(200).json({ msg: "Consumer updated successfully!", data: updated });
    } catch (error) {
        console.error("Update consumer error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
});

//Delete the saving account list 
HomeRouter.delete('/delete-saving-account/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(401).json({ msg: "Id is required !" });

        }

        //delete query fpor deleting the saving account lists
        const delete_account = await SavingModel.findByIdAndDelete(id);

        if (!delete_account) {
            return res.status(404).json({ msg: 'Somethings went wrong !' })
        }

        return res.status(200).json({ msg: "Saving account deleted successfully !" });
    } catch (error) {
        console.error(`Error from deleting the saving account list and error is the ${error}`);
    }
})

// ✅ Update agent by ID
HomeRouter.put('/update-agent/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, password } = req.body;

        // Check if agent exists
        const existingAgent = await AgentModel.findById(id);
        if (!existingAgent) {
            return res.status(404).json({ msg: "Agent not found" });
        }

        // Check if phone or email already exists (excluding current agent)
        const duplicateCheck = await AgentModel.findOne({
            $and: [
                { _id: { $ne: id } },
                {
                    $or: [
                        ...(phone ? [{ phone: phone }] : []),
                        ...(email ? [{ email: email }] : [])
                    ]
                }
            ]
        });

        if (duplicateCheck) {
            return res.status(400).json({
                msg: "Phone or Email already exists!"
            });
        }

        // Build update data
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;

        // If password provided, hash it
        if (password) {
            const saltRounds = 10;
            updateData.password = await bcryptjs.hash(password, saltRounds);
        }

        const updatedAgent = await AgentModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        return res.status(200).json({
            msg: "Agent updated successfully!",
            data: updatedAgent
        });

    } catch (error) {
        console.error("Update agent error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error.message
        });
    }
});

// ✅ Delete agent by ID
HomeRouter.delete('/delete-agent/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(401).json({ msg: "Id is required!" });
        }

        const deletedAgent = await AgentModel.findByIdAndDelete(id);

        if (!deletedAgent) {
            return res.status(404).json({ msg: "Agent not found" });
        }

        return res.status(200).json({
            msg: "Agent deleted successfully!",
            data: deletedAgent
        });

    } catch (error) {
        console.error("Delete agent error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error.message
        });
    }
});

// ✅ Get single agent by ID
HomeRouter.get('/get-agent/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const agent = await AgentModel.findById(id);

        if (!agent) {
            return res.status(404).json({ msg: "Agent not found" });
        }

        return res.status(200).json({
            msg: "Agent fetched successfully!",
            data: agent
        });

    } catch (error) {
        console.error("Get agent error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error.message
        });
    }
});

//delete renuwal saving lists api 
HomeRouter.delete('/delete-renuwal-saving/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(401).json({ msg: "Id not receive from the query paramiters" })
        }

        const delete_renuwal_saving_acc = await newRenuwalSavingModel.findByIdAndDelete(id);

        if (!delete_renuwal_saving_acc) {
            return res.status(404).json({ msg: "Invalid id received from teh quary paramiters" })
        }

        return res.status(200).json({ msg: "Renuwal Data Deleted Successfully" });

    } catch (error) {
        console.error(`Error from  deleting renuwal saving api and error is the ${error}`)
    }
})


//login the conuser by the consumer id and password 
HomeRouter.post('/consumer-login', async (req, res) => {
    try {
        const { consumerid, password } = req.body;

        if (!consumerid || !password) {
            return res.status(401).json({ msg: 'All fields is required !' })
        }

        const getConsumer = await ConsumerModel.findOne({ membership_no: consumerid });

        if (!getConsumer) {
            return res.status(404).json({ msg: "Invalid Creadential" })
        }

        if (getConsumer.password !== password) {
            return res.status(401).json({ msg: "Invalid Creadentials" })
        }

        const newToken = jwt.sign({ email: getConsumer.email }, SECRET_KEY, { expiresIn: "365d" });

        return res.status(201).json({ msg: "Consumer Login Successfully !", token: newToken });

    } catch (error) {
        console.error(`Error from the consumer login api and error is the ${error}`)
    }
})

module.exports = HomeRouter;



