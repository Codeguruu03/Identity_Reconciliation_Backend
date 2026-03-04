import prisma from "../prisma/prismaClient";

export const handleIdentity = async (email?: string, phoneNumber?: string) => {

 const existingContacts = await prisma.contact.findMany({
  where: {
   OR: [
    { email: email || undefined },
    { phoneNumber: phoneNumber || undefined }
   ]
  }
 });

 if (existingContacts.length === 0) {

  const newContact = await prisma.contact.create({
   data: {
    email,
    phoneNumber,
    linkPrecedence: "primary"
   }
  });

  return {
   contact: {
    primaryContactId: newContact.id,
    emails: [email],
    phoneNumbers: [phoneNumber],
    secondaryContactIds: []
   }
  };
 }

 let primaryContact =
  existingContacts.find(c => c.linkPrecedence === "primary") ||
  existingContacts[0];

 const primaryId = primaryContact.linkedId || primaryContact.id;

 const allLinkedContacts = await prisma.contact.findMany({
  where: {
   OR: [
    { id: primaryId },
    { linkedId: primaryId }
   ]
  }
 });

 const emails = new Set<string>();
 const phones = new Set<string>();
 const secondaryIds: number[] = [];

 allLinkedContacts.forEach(contact => {
  if (contact.email) emails.add(contact.email);
  if (contact.phoneNumber) phones.add(contact.phoneNumber);
  if (contact.linkPrecedence === "secondary") secondaryIds.push(contact.id);
 });

 if (email && !emails.has(email) || phoneNumber && !phones.has(phoneNumber)) {

  const newSecondary = await prisma.contact.create({
   data: {
    email,
    phoneNumber,
    linkedId: primaryId,
    linkPrecedence: "secondary"
   }
  });

  secondaryIds.push(newSecondary.id);
  if (email) emails.add(email);
  if (phoneNumber) phones.add(phoneNumber);
 }

 return {
  contact: {
   primaryContactId: primaryId,
   emails: Array.from(emails),
   phoneNumbers: Array.from(phones),
   secondaryContactIds: secondaryIds
  }
 };
};