import { Client, Databases, ID, Query, Account } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appWriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { avatarPlaceholderUrl } from "@/constants";

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

export const sendEmailOTP = async ({ email }: { email: string }) => {
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
          avatar: avatarPlaceholderUrl,
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

export const getCurrentUser = async () => {
  const { endpoint, projectId, session } = await createSessionClient();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(session);

  const account = new Account(client);
  const databases = new Databases(client);

  const result = await account.get();

  const user = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.usersCollectionId,
    [Query.equal("accountId", result.$id)]
  );
  if (user.total <= 0) return null;

  return parseStringify(user.documents[0]);
};
