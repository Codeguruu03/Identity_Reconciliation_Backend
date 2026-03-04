import prisma from "../prisma/prismaClient";

export const handleIdentity = async (email?: string, phoneNumber?: string) => {

    // Step 1: Find all existing contacts that match the given email OR phone
    const existingContacts = await prisma.contact.findMany({
        where: {
            OR: [
                ...(email ? [{ email }] : []),
                ...(phoneNumber ? [{ phoneNumber }] : []),
            ],
        },
    });

    // Step 2: No existing contact → create a new primary contact
    if (existingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email: email ?? null,
                phoneNumber: phoneNumber ?? null,
                linkPrecedence: "primary",
            },
        });

        return {
            contact: {
                primaryContactId: newContact.id,
                emails: email ? [email] : [],
                phoneNumbers: phoneNumber ? [phoneNumber] : [],
                secondaryContactIds: [],
            },
        };
    }

    // Step 3: Resolve true primary IDs from matched contacts
    // A contact is a secondary if it has a linkedId; its true primary is its linkedId
    const primaryIds = new Set<number>();
    for (const c of existingContacts) {
        if (c.linkPrecedence === "primary") {
            primaryIds.add(c.id);
        } else if (c.linkedId) {
            primaryIds.add(c.linkedId);
        }
    }

    // Step 4: Fetch full clusters for all resolved primaries
    const allLinkedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: { in: Array.from(primaryIds) } },
                { linkedId: { in: Array.from(primaryIds) } },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // Step 5: Determine the single oldest primary (the true root)
    const primaries = allLinkedContacts
        .filter((c) => c.linkPrecedence === "primary")
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const truePrimary = primaries[0]; // oldest = real primary

    // Step 6: Demote any newer primaries to secondary
    const newerPrimaries = primaries.slice(1);
    if (newerPrimaries.length > 0) {
        await prisma.contact.updateMany({
            where: {
                id: { in: newerPrimaries.map((c) => c.id) },
            },
            data: {
                linkedId: truePrimary.id,
                linkPrecedence: "secondary",
                updatedAt: new Date(),
            },
        });

        // Also re-parent any secondaries that pointed to the now-demoted primaries
        await prisma.contact.updateMany({
            where: {
                linkedId: { in: newerPrimaries.map((c) => c.id) },
            },
            data: {
                linkedId: truePrimary.id,
                updatedAt: new Date(),
            },
        });
    }

    // Step 7: Re-fetch the entire cluster after potential demotion
    const finalCluster = await prisma.contact.findMany({
        where: {
            OR: [
                { id: truePrimary.id },
                { linkedId: truePrimary.id },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // Step 8: Collect all unique emails and phones (primary's values come first)
    const emails: string[] = [];
    const phones: string[] = [];
    const secondaryIds: number[] = [];

    // Add primary's data first
    if (truePrimary.email) emails.push(truePrimary.email);
    if (truePrimary.phoneNumber) phones.push(truePrimary.phoneNumber);

    for (const c of finalCluster) {
        if (c.id === truePrimary.id) continue;
        if (c.email && !emails.includes(c.email)) emails.push(c.email);
        if (c.phoneNumber && !phones.includes(c.phoneNumber)) phones.push(c.phoneNumber);
        secondaryIds.push(c.id);
    }

    // Step 9: Check if the incoming request brings new info not seen in the cluster
    const emailIsNew = email && !emails.includes(email);
    const phoneIsNew = phoneNumber && !phones.includes(phoneNumber);

    if (emailIsNew || phoneIsNew) {
        const newSecondary = await prisma.contact.create({
            data: {
                email: email ?? null,
                phoneNumber: phoneNumber ?? null,
                linkedId: truePrimary.id,
                linkPrecedence: "secondary",
            },
        });

        if (email && emailIsNew) emails.push(email);
        if (phoneNumber && phoneIsNew) phones.push(phoneNumber);
        secondaryIds.push(newSecondary.id);
    }

    return {
        contact: {
            primaryContactId: truePrimary.id,
            emails,
            phoneNumbers: phones,
            secondaryContactIds: secondaryIds,
        },
    };
};