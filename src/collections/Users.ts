import type { CollectionConfig } from "payload";

type UserWithRole = {
  id: number | string;
  role?: unknown;
};

function isAdmin(user: UserWithRole | null | undefined): boolean {
  return user?.role === "admin";
}

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    read: ({ req }) => {
      if (isAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    update: ({ req }) => {
      if (isAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
  },
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  fields: [
    {
      name: "role",
      type: "select",
      access: {
        update: ({ req }) => isAdmin(req.user),
      },
      defaultValue: "admin",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      required: true,
      saveToJWT: true,
    },
  ],
};
