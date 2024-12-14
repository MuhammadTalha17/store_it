import { Models } from "node-appwrite";
import React from "react";

export const Card = ({ file }: { file: Models.Document }) => {
  return <div>{file.name}</div>;
};
