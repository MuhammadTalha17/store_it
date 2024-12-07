import { Client, Databases, ID, Query, Account } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appWriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
  const { endpoint, projectId, secretKey } = await createAdminClient();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(secretKey);

  const databases = new Databases(client);

  const result = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(message, error);
  throw error;
};

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { endpoint, projectId, secretKey } = await createAdminClient();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(secretKey);

  const account = new Account(client);

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    console.log("Email OTP sent, session:", session);

    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  try {
    console.log("Starting createAccount");

    const existingUser = await getUserByEmail(email);
    console.log("Existing user:", existingUser);

    const accountId = await sendEmailOTP({ email });
    console.log("Account ID from OTP:", accountId);
    if (!accountId) throw new Error("Failed to send an OTP");

    if (!existingUser) {
      const { endpoint, projectId, secretKey } = await createAdminClient();
      console.log("Admin client created");

      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(secretKey);

      const databases = new Databases(client);
      console.log("Databases instance created");

      await databases.createDocument(
        appWriteConfig.databaseId,
        appWriteConfig.usersCollectionId,
        ID.unique(),
        {
          fullName,
          email,
          avatar:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrCLHZeA--7ckaEIUPD-Z0XASJ5BxYQYLsdA&s",
          accountId,
        }
      );
      console.log("Document created in database");
    }

    return parseStringify({ accountId });
  } catch (error) {
    console.log("Error in createAccount:", error);
    throw new Error("Failed to create an account. Please try again.");
  }
};
