"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identify = void 0;
const identityService_1 = require("../services/identityService");
const identify = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) {
            res.status(400).json({ error: "At least one of email or phoneNumber is required." });
            return;
        }
        const result = await (0, identityService_1.handleIdentity)(email ?? undefined, phoneNumber !== undefined && phoneNumber !== null ? String(phoneNumber) : undefined);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("Error in /identify:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.identify = identify;
