import { Request, Response } from "express";
import { handleIdentity } from "../services/identityService";

export const identify = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            res.status(400).json({ error: "At least one of email or phoneNumber is required." });
            return;
        }

        const result = await handleIdentity(
            email ?? undefined,
            phoneNumber !== undefined && phoneNumber !== null ? String(phoneNumber) : undefined
        );

        res.status(200).json(result);
    } catch (err) {
        console.error("Error in /identify:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};