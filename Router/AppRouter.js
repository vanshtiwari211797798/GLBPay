const express = require('express');
const AppRouter = express.Router();
const fetchProfileConsumer = require('../Middlewares/ConsumerProfileChecker');
const SavingModel = require('../Models/SavingModel');
const newRenuwalSavingModel = require('../Models/RenuwalSaving');

// 1. Consumer Profile
AppRouter.get('/consumer-profile', fetchProfileConsumer, async (req, res) => {
    try {
        const data = req.cprofile;
        return res.status(200).json({ msg: "Hello app api", data: data });
    } catch (error) {
        console.error(`Error from fetching consumer profile ${error}`)
    }
});

// 2. Account Balance (Specific Account + UPI PIN Required)
AppRouter.post('/account-balance', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find the specific account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is active
        if (!account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for this account ! Please activate UPI first." });
        }

        // ✅ Verify UPI PIN (plain text comparison for now)
        if (account.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Calculate balance from renewals
        const renewals = await newRenuwalSavingModel.find({ accountno: account.saving_number });
        const total_deposited = renewals.reduce((sum, r) => sum + Number(r.deposit_amount), 0);

        return res.status(200).json({
            msg: "Account balance fetched successfully !",
            data: {
                saving_number: account.saving_number,
                account_holder: account.account_holder,
                branch: account.branch,
                phone: account.phone,
                upiIds: account.upiIds || [],
                balance: total_deposited,
                available_balance: total_deposited - (account.minimum_d || 0)
            }
        });

    } catch (error) {
        console.error(`Error from fetching account balance ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 3. Transaction History (Specific Account)
AppRouter.post('/transactions', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find the specific account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is active
        if (!account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for this account ! Please activate UPI first." });
        }

        // ✅ Verify UPI PIN
        if (account.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Get transactions for this specific account
        const transactions = await newRenuwalSavingModel
            .find({ accountno: account.saving_number })
            .sort({ createdAt: -1 });

        // ✅ Calculate balance info
        const total_deposited = transactions.reduce((sum, t) => sum + Number(t.deposit_amount), 0);
        const total_credits = transactions.filter(t => t.deposit_amount > 0).reduce((sum, t) => sum + Number(t.deposit_amount), 0);
        const total_debits = transactions.filter(t => t.deposit_amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.deposit_amount)), 0);

        return res.status(200).json({
            msg: "Transaction history fetched successfully !",
            data: {
                account: {
                    saving_number: account.saving_number,
                    account_holder: account.account_holder,
                    branch: account.branch,
                    phone: account.phone
                },
                summary: {
                    total_transactions: transactions.length,
                    total_credits: total_credits,
                    total_debits: total_debits,
                    closing_balance: total_deposited
                },
                transactions: transactions.map(t => ({
                    id: t._id,
                    date: t.createdAt,
                    accountno: t.accountno,
                    holdername: t.holdername,
                    amount: Math.abs(Number(t.deposit_amount)),
                    type: t.deposit_amount > 0 ? 'CREDIT' : 'DEBIT',
                    description: t.deposit_by || 'Transaction',
                    balance: null // Running balance calculate karna hai toh alag se
                }))
            }
        });

    } catch (error) {
        console.error(`Error from fetching transactions ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 4. Mini Statement (Specific Account - Last 10 Transactions)
AppRouter.post('/mini-statement', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find the specific account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is active
        if (!account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for this account ! Please activate UPI first." });
        }

        // ✅ Verify UPI PIN
        if (account.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Get last 10 transactions for this specific account
        const miniStatement = await newRenuwalSavingModel
            .find({ accountno: account.saving_number })
            .sort({ createdAt: -1 })
            .limit(10);

        // ✅ Calculate current balance
        const allTransactions = await newRenuwalSavingModel
            .find({ accountno: account.saving_number })
            .sort({ createdAt: 1 });

        let runningBalance = 0;
        const balanceMap = {};
        allTransactions.forEach(t => {
            runningBalance += Number(t.deposit_amount);
            balanceMap[t._id.toString()] = runningBalance;
        });

        // ✅ Format mini statement with running balance
        const formattedStatement = miniStatement.map(t => ({
            id: t._id,
            date: t.createdAt,
            accountno: t.accountno,
            holdername: t.holdername,
            amount: Math.abs(Number(t.deposit_amount)),
            type: t.deposit_amount > 0 ? 'CREDIT' : 'DEBIT',
            description: t.deposit_by || 'Transaction',
            balance: balanceMap[t._id.toString()] || null
        }));

        // ✅ Calculate summary
        const totalCredits = miniStatement.filter(t => t.deposit_amount > 0).reduce((sum, t) => sum + Number(t.deposit_amount), 0);
        const totalDebits = miniStatement.filter(t => t.deposit_amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.deposit_amount)), 0);

        return res.status(200).json({
            msg: "Mini statement fetched successfully !",
            data: {
                account: {
                    saving_number: account.saving_number,
                    account_holder: account.account_holder,
                    branch: account.branch,
                    phone: account.phone,
                    upiIds: account.upiIds || []
                },
                summary: {
                    total_transactions: miniStatement.length,
                    total_credits: totalCredits,
                    total_debits: totalDebits,
                    closing_balance: runningBalance
                },
                transactions: formattedStatement
            }
        });

    } catch (error) {
        console.error(`Error from fetching mini statement ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 5. Change Password (Consumer Login Password)
AppRouter.put('/change-password', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ msg: "Old password and new password are required !" });
        }

        const dbPass = consumer.password ? consumer.password.trim() : "";
        const oldPass = old_password.trim();

        if (dbPass !== oldPass) {
            return res.status(401).json({ msg: "Old password is incorrect !" });
        }

        if (oldPass === new_password.trim()) {
            return res.status(400).json({ msg: "New password cannot be same as old password !" });
        }

        const ConsumerModel = require('../Models/ConsumerModel');
        await ConsumerModel.findByIdAndUpdate(consumer._id, { password: new_password.trim() });

        return res.status(200).json({ msg: "Password changed successfully !" });

    } catch (error) {
        console.error(`Error from changing password ${error}`);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// 6. Passbook (Specific Account - All Transactions with Running Balance)
AppRouter.post('/passbook', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find the specific account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is active
        if (!account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for this account ! Please activate UPI first." });
        }

        // ✅ Verify UPI PIN
        if (account.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Get all transactions for this account (oldest first)
        const allTransactions = await newRenuwalSavingModel
            .find({ accountno: account.saving_number })
            .sort({ createdAt: 1 });

        // ✅ Build passbook with running balance
        let running_balance = 0;
        const passbook = allTransactions.map(txn => {
            const amount = Number(txn.deposit_amount);
            running_balance += amount;

            // Determine transaction type
            let type = 'CREDIT';
            let description = txn.deposit_by || 'Transaction';
            let credit = 0;
            let debit = 0;

            if (amount > 0) {
                credit = amount;
                type = 'CREDIT';
            } else if (amount < 0) {
                debit = Math.abs(amount);
                type = 'DEBIT';
                description = txn.deposit_by || 'Withdrawal';
            }

            return {
                date: txn.createdAt,
                accountno: txn.accountno,
                holdername: txn.holdername || account.account_holder,
                description: description,
                type: type,
                credit: credit,
                debit: debit,
                balance: running_balance,
                reference_id: txn._id
            };
        });

        // ✅ Calculate summary
        const totalCredits = allTransactions.filter(t => t.deposit_amount > 0).reduce((sum, t) => sum + Number(t.deposit_amount), 0);
        const totalDebits = allTransactions.filter(t => t.deposit_amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.deposit_amount)), 0);

        return res.status(200).json({
            msg: "Passbook fetched successfully !",
            data: {
                account: {
                    saving_number: account.saving_number,
                    account_holder: account.account_holder,
                    branch: account.branch,
                    phone: account.phone,
                    opening_date: account.opening_date,
                    initital_d: account.initital_d,
                    minimum_d: account.minimum_d,
                    interest: account.interest,
                    upiIds: account.upiIds || []
                },
                summary: {
                    total_entries: passbook.length,
                    total_credits: totalCredits,
                    total_debits: totalDebits,
                    opening_balance: 0,
                    closing_balance: running_balance
                },
                passbook: passbook
            }
        });

    } catch (error) {
        console.error(`Error from fetching passbook ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 7. My Account Details (Specific Account with UPI PIN)
AppRouter.post('/my-account-details', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find the specific account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is active
        if (!account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for this account ! Please activate UPI first." });
        }

        // ✅ Verify UPI PIN
        if (account.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Get balance for this account
        const renewals = await newRenuwalSavingModel.find({ accountno: account.saving_number });
        const total_deposited = renewals.reduce((sum, r) => sum + Number(r.deposit_amount), 0);
        const renewalCount = renewals.length;

        // ✅ Get recent transactions (last 5)
        const recentTransactions = await newRenuwalSavingModel
            .find({ accountno: account.saving_number })
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            msg: "Account details fetched successfully !",
            data: {
                consumer: {
                    name: consumer.name,
                    membership_no: consumer.membership_no,
                    phone: consumer.phone,
                    email: consumer.email,
                    photo: consumer.photo
                },
                account: {
                    saving_number: account.saving_number,
                    account_holder: account.account_holder,
                    father_husband: account.father_husband,
                    dob: account.dob,
                    gender: account.gender,
                    merital: account.merital,
                    occupation: account.occupation,
                    branch: account.branch,
                    phone: account.phone,
                    email: account.email,
                    city: account.city,
                    state: account.state,
                    pincode: account.pincode,
                    address: account.address,
                    opening_date: account.opening_date,
                    initital_d: account.initital_d,
                    minimum_d: account.minimum_d,
                    interest: account.interest,
                    nominee_name: account.nominee_name,
                    relation: account.relation,
                    n_dob: account.n_dob,
                    n_contact: account.n_contact,
                    a_name: account.a_name,
                    a_code: account.a_code,
                    upiIds: account.upiIds || [],
                    isUpiActive: account.isUpiActive,
                    balance: total_deposited,
                    renewal_count: renewalCount
                },
                recent_transactions: recentTransactions.map(t => ({
                    id: t._id,
                    date: t.createdAt,
                    amount: Math.abs(Number(t.deposit_amount)),
                    type: t.deposit_amount > 0 ? 'CREDIT' : 'DEBIT',
                    description: t.deposit_by || 'Transaction'
                }))
            }
        });

    } catch (error) {
        console.error(`Error from fetching account details ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 8. Activate UPI for a specific account (Generate 3 UPI IDs)
AppRouter.post('/activate-upi', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber, upiPin, confirmPin } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }
        if (!upiPin || !confirmPin) {
            return res.status(400).json({ msg: "UPI PIN and Confirm PIN are required !" });
        }
        if (upiPin.length !== 4 || !/^\d{4}$/.test(upiPin)) {
            return res.status(400).json({ msg: "UPI PIN must be exactly 4 digits !" });
        }
        if (upiPin !== confirmPin) {
            return res.status(400).json({ msg: "UPI PIN and Confirm PIN do not match !" });
        }

        // ✅ Find the account
        const account = await SavingModel.findOne({
            saving_number: accountNumber,
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        // ✅ Check if UPI is already active
        if (account.isUpiActive) {
            return res.status(400).json({ msg: "UPI is already active for this account !" });
        }

        // ✅ Generate 3 UPI IDs for this account
        const cleanPhone = consumer.phone.replace(/[^0-9]/g, '');

        // Find the next available counter
        const allAccounts = await SavingModel.find({ membership_id: consumer.membership_no });
        let maxCounter = 0;
        allAccounts.forEach(acc => {
            if (acc.upiIds && acc.upiIds.length > 0) {
                acc.upiIds.forEach(id => {
                    const match = id.match(/-(\d+)@/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (num > maxCounter) maxCounter = num;
                    }
                });
            }
        });

        let counter = maxCounter + 1;
        const upiIds = [];

        // Primary UPI ID
        if (counter === 1) {
            upiIds.push(`${cleanPhone}@glbpay`);
        } else {
            upiIds.push(`${cleanPhone}-${counter}@glbpay`);
            counter++;
        }

        // Secondary 1
        upiIds.push(`${cleanPhone}-${counter}@glbpay`);
        counter++;

        // Secondary 2
        upiIds.push(`${cleanPhone}-${counter}@glbpay`);

        // ✅ Update account with UPI IDs and PIN
        account.upiIds = upiIds;
        account.upiPin = upiPin;
        account.isUpiActive = true;
        await account.save();

        return res.status(200).json({
            msg: "UPI activated successfully for this account !",
            data: {
                saving_number: account.saving_number,
                account_holder: account.account_holder,
                upiIds: upiIds,
                isUpiActive: true,
                upiPinSet: true
            }
        });

    } catch (error) {
        console.error(`Error from activating UPI: ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 9. Get Account UPI Details
AppRouter.get('/get-account-upi/:accountNumber', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        if (!consumer) return res.status(401).json({ msg: "Unauthorized access" });

        const { accountNumber } = req.params;

        if (!accountNumber) {
            return res.status(400).json({ msg: "Account number is required !" });
        }

        // ✅ Find the account
        const account = await SavingModel.findOne({
            saving_number: parseInt(accountNumber),
            membership_id: consumer.membership_no
        });

        if (!account) {
            return res.status(404).json({ msg: "Account not found for this consumer !" });
        }

        return res.status(200).json({
            msg: "Account UPI details fetched successfully !",
            data: {
                saving_number: account.saving_number,
                account_holder: account.account_holder,
                upiIds: account.upiIds || [],
                isUpiActive: account.isUpiActive || false,
                hasUpiPin: account.upiPin ? true : false
            }
        });

    } catch (error) {
        console.error(`Error from fetching account UPI details: ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 10. UPI Transaction (Account to UPI ID + UPI PIN Required)
AppRouter.post('/upi-transfer', fetchProfileConsumer, async (req, res) => {
    try {
        const sender = req.cprofile;
        if (!sender) return res.status(401).json({ msg: "Unauthorized access" });

        const { senderAccountNumber, receiverUpiId, amount, upiPin, note } = req.body;

        // ✅ Validation
        if (!senderAccountNumber) {
            return res.status(400).json({ msg: "Sender account number is required !" });
        }
        if (!receiverUpiId) {
            return res.status(400).json({ msg: "Receiver UPI ID is required !" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ msg: "Valid amount is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find sender account
        const senderAccount = await SavingModel.findOne({
            saving_number: senderAccountNumber,
            membership_id: sender.membership_no
        });

        if (!senderAccount) {
            return res.status(404).json({ msg: "Sender account not found !" });
        }

        // ✅ Check if sender UPI is active
        if (!senderAccount.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for sender account !" });
        }

        // ✅ Verify UPI PIN
        if (senderAccount.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Check sender balance
        const allDeposits = await newRenuwalSavingModel.find({ accountno: senderAccount.saving_number });
        const senderBalance = allDeposits.reduce((sum, r) => sum + Number(r.deposit_amount), 0);

        if (senderBalance < amount) {
            return res.status(400).json({ msg: "Insufficient balance !" });
        }

        // ✅ Find receiver by UPI ID (search in all Saving accounts)
        const receiverAccount = await SavingModel.findOne({
            upiIds: { $in: [receiverUpiId] }
        });

        if (!receiverAccount) {
            return res.status(404).json({ msg: "Receiver UPI ID not found !" });
        }

        // ✅ Check if receiver UPI is active
        if (!receiverAccount.isUpiActive) {
            return res.status(400).json({ msg: "Receiver UPI is not active !" });
        }

        // ✅ Find receiver consumer details
        const ConsumerModel = require('../Models/ConsumerModel');
        const receiverConsumer = await ConsumerModel.findOne({
            membership_no: receiverAccount.membership_id
        });

        if (!receiverConsumer) {
            return res.status(404).json({ msg: "Receiver not found !" });
        }

        // ✅ Debit sender
        const debitEntry = new newRenuwalSavingModel({
            accountno: senderAccount.saving_number,
            holdername: sender.name,
            phone: sender.phone,
            branch: senderAccount.branch,
            deposit_amount: -amount,
            deposit_by: `UPI to ${receiverConsumer.name} (${receiverUpiId})`
        });
        await debitEntry.save();

        // ✅ Credit receiver
        const creditEntry = new newRenuwalSavingModel({
            accountno: receiverAccount.saving_number,
            holdername: receiverConsumer.name,
            phone: receiverConsumer.phone,
            branch: receiverAccount.branch,
            deposit_amount: amount,
            deposit_by: `UPI from ${sender.name} (${senderAccount.upiIds?.[0] || sender.phone})`
        });
        await creditEntry.save();

        return res.status(200).json({
            msg: "UPI transfer completed successfully !",
            transaction: {
                from: {
                    name: sender.name,
                    account: senderAccount.saving_number,
                    upiId: senderAccount.upiIds?.[0] || null
                },
                to: {
                    name: receiverConsumer.name,
                    account: receiverAccount.saving_number,
                    upiId: receiverUpiId
                },
                amount: amount,
                note: note || "N/A",
                timestamp: new Date().toISOString(),
                transactionId: debitEntry._id
            }
        });

    } catch (error) {
        console.error(`Error from UPI transfer: ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 11. Bank Transfer (Account to Account + UPI PIN Required)
AppRouter.post('/bank-transfer', fetchProfileConsumer, async (req, res) => {
    try {
        const sender = req.cprofile;
        if (!sender) return res.status(401).json({ msg: "Unauthorized access" });

        const { senderAccountNumber, receiverAccountNumber, amount, upiPin, note } = req.body;

        // ✅ Validation
        if (!senderAccountNumber) {
            return res.status(400).json({ msg: "Sender account number is required !" });
        }
        if (!receiverAccountNumber) {
            return res.status(400).json({ msg: "Receiver account number is required !" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ msg: "Valid amount is required !" });
        }
        if (!upiPin) {
            return res.status(400).json({ msg: "UPI PIN is required !" });
        }

        // ✅ Find sender account
        const senderAccount = await SavingModel.findOne({
            saving_number: senderAccountNumber,
            membership_id: sender.membership_no
        });

        if (!senderAccount) {
            return res.status(404).json({ msg: "Sender account not found !" });
        }

        // ✅ Check if sender UPI is active
        if (!senderAccount.isUpiActive) {
            return res.status(400).json({ msg: "UPI is not activated for sender account !" });
        }

        // ✅ Verify UPI PIN
        if (senderAccount.upiPin !== upiPin) {
            return res.status(401).json({ msg: "Invalid UPI PIN !" });
        }

        // ✅ Check sender balance
        const allDeposits = await newRenuwalSavingModel.find({ accountno: senderAccount.saving_number });
        const senderBalance = allDeposits.reduce((sum, r) => sum + Number(r.deposit_amount), 0);

        if (senderBalance < amount) {
            return res.status(400).json({ msg: "Insufficient balance !" });
        }

        // ✅ Find receiver account
        const receiverAccount = await SavingModel.findOne({
            saving_number: receiverAccountNumber
        });

        if (!receiverAccount) {
            return res.status(404).json({ msg: "Receiver account not found !" });
        }

        // ✅ Check if receiver UPI is active
        if (!receiverAccount.isUpiActive) {
            return res.status(400).json({ msg: "Receiver UPI is not active !" });
        }

        // ✅ Find receiver consumer details
        const ConsumerModel = require('../Models/ConsumerModel');
        const receiverConsumer = await ConsumerModel.findOne({
            membership_no: receiverAccount.membership_id
        });

        if (!receiverConsumer) {
            return res.status(404).json({ msg: "Receiver not found !" });
        }

        // ✅ Debit sender
        const debitEntry = new newRenuwalSavingModel({
            accountno: senderAccount.saving_number,
            holdername: sender.name,
            phone: sender.phone,
            branch: senderAccount.branch,
            deposit_amount: -amount,
            deposit_by: `Bank transfer to ${receiverConsumer.name} (${receiverAccountNumber})`
        });
        await debitEntry.save();

        // ✅ Credit receiver
        const creditEntry = new newRenuwalSavingModel({
            accountno: receiverAccount.saving_number,
            holdername: receiverConsumer.name,
            phone: receiverConsumer.phone,
            branch: receiverAccount.branch,
            deposit_amount: amount,
            deposit_by: `Bank transfer from ${sender.name} (${senderAccountNumber})`
        });
        await creditEntry.save();

        return res.status(200).json({
            msg: "Bank transfer completed successfully !",
            transaction: {
                from: {
                    name: sender.name,
                    account: senderAccount.saving_number
                },
                to: {
                    name: receiverConsumer.name,
                    account: receiverAccount.saving_number
                },
                amount: amount,
                note: note || "N/A",
                timestamp: new Date().toISOString(),
                transactionId: debitEntry._id
            }
        });

    } catch (error) {
        console.error(`Error from bank transfer: ${error}`);
        return res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

// 12. Get All UPI IDs
AppRouter.get('/my-upi-ids', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;

        return res.status(200).json({
            msg: "UPI IDs fetched successfully !",
            primaryUpiId: consumer.upiId || `${consumer.phone.replace(/[^0-9]/g, '')}@glbpay`,
            secondaryUpiIds: consumer.secondaryUpiIds || []
        });

    } catch (error) {
        console.error(`Error from fetching UPI IDs: ${error}`);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// 13. Delete Secondary UPI ID
AppRouter.delete('/delete-secondary-upi', fetchProfileConsumer, async (req, res) => {
    try {
        const consumer = req.cprofile;
        const { upiId } = req.body;

        if (!upiId) return res.status(400).json({ msg: "UPI ID is required !" });

        const primaryUpiId = consumer.upiId || `${consumer.phone.replace(/[^0-9]/g, '')}@glbpay`;
        if (upiId === primaryUpiId) {
            return res.status(400).json({ msg: "Cannot delete primary UPI ID ! You can only delete secondary UPI IDs." });
        }

        if (!consumer.secondaryUpiIds.includes(upiId)) {
            return res.status(404).json({ msg: "UPI ID not found in secondary list !" });
        }

        const ConsumerModel = require('../Models/ConsumerModel');
        await ConsumerModel.findByIdAndUpdate(consumer._id, {
            $pull: { secondaryUpiIds: upiId }
        });

        return res.status(200).json({
            msg: "Secondary UPI ID deleted successfully !",
            deletedUpiId: upiId
        });

    } catch (error) {
        console.error(`Error from deleting secondary UPI: ${error}`);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// 14. Fetch all active upi ids date show 

AppRouter.get('/get-all-active-upi', fetchProfileConsumer, async (req, res) => {
    try {
        const active_upi_data = req.cprofile.membership_no;
        const get_active_upi_q = await SavingModel.find({ membership_id: active_upi_data, isUpiActive: true });

        if (get_active_upi_q.length === 0) {
            return res.status(404).json({
                msg: "No Active UPI Available"
            });
        }

        return res.status(200).json({ msg: "Data fetched duccessfully !", data: get_active_upi_q });
    } catch (error) {
        console.error(`Error from fetching the upi ids and error is the ${error}`)
    }
})

//  15.  get all in actuve upi details 
AppRouter.get('/get-all-inactive-upi', fetchProfileConsumer, async (req, res) => {
    try {
        const getConsumer_data_inactive = req.cprofile.membership_no;

        //fetch all inactive users saving accvount details thats upi is not created 

        const get_inactive_upi = await SavingModel.find({ membership_id: getConsumer_data_inactive, isUpiActive: !true })

        if (get_inactive_upi.length === 0) {
            return res.status(404).json({
                msg: "No Inactive UPI Available"
            });
        }

        return res.status(200).json({ msg: "Data fetched duccessfully !", data: get_inactive_upi });
    } catch (error) {
        console.error(`Error from fetch all inactive upi details dat and eror is the ${error}`)
    }
})

module.exports = AppRouter;