"use server";

import { Client, Databases, ID, Query, Account } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appWriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

const handleError = (error: unknown, message: string) => {
  console.log(message, error);
  throw error;
};

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { endpoint, projectId, secretKey } = await createAdminClient();

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(secretKey);

    const account = new Account(client);
    const session = await account.createSession(accountId, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};
