"use server";

import { Account, Client, Databases } from "node-appwrite";
import { appWriteConfig } from "./config";
import { cookies } from "next/headers";

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appWriteConfig.endpointUrl)
    .setProject(appWriteConfig.projectId);

  const session = (await cookies()).get("appwrite-session");

  if (!session || !session.value) throw new Error("No session");

  client.setSession(session.value);

  return {
    endpoint: appWriteConfig.endpointUrl,
    projectId: appWriteConfig.projectId,
    session: session.value,
  };
};

export const createAdminClient = async () => {
  return {
    endpoint: appWriteConfig.endpointUrl,
    projectId: appWriteConfig.projectId,
    secretKey: appWriteConfig.secretKey,
  };
};

export const getSessionData = async () => {
  const { endpoint, projectId, session } = await createSessionClient();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(session);

  const account = new Account(client);
  const databases = new Databases(client);

  return { account, databases };
};
