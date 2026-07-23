import type { Access } from "payload";

function getUserRole(user: unknown): unknown {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }

  return user.role;
}

export function isAdmin(user: unknown): boolean {
  return getUserRole(user) === "admin";
}

export function isAdminOrEditor(user: unknown): boolean {
  const role = getUserRole(user);

  return role === "admin" || role === "editor";
}

export const adminOnly: Access = ({ req }) => isAdmin(req.user);

export const adminOrEditor: Access = ({ req }) =>
  isAdminOrEditor(req.user);

export const publishedOrAdminOrEditor: Access = ({ req }) => {
  if (isAdminOrEditor(req.user)) return true;

  return {
    _status: {
      equals: "published",
    },
  };
};
