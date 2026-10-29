import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
} from "payload";
import { PublicRequestRefusal, isAdmin } from "@/lib/payloadAccess";
import {
  preventDeletingLastAdmin,
  preventDemotingLastAdmin,
} from "@/lib/payloadDeleteGuards";
import { isHttpsDeployment } from "@/lib/payloadInfrastructure";

/** Failed logins before Payload locks an account, and for how long. */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_TIME_MS = 10 * 60 * 1000;

/**
 * New accounts get the least privilege. The very first account is the only
 * exception: it must be an admin, otherwise nobody could ever manage users.
 */
export const assignFirstUserAdminRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") return data;

  const { totalDocs } = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });

  return totalDocs === 0 ? { ...data, role: "admin" } : data;
};

/**
 * There is no email adapter yet (see `payload.config.ts`), so a reset email
 * would never arrive. Payload would still create a reset token and the admin
 * would claim the email was sent. Refuse the request explicitly instead; the
 * message is the same for every address, so it reveals no account.
 */
export const refusePasswordResetWithoutEmail: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation === "forgotPassword" && req.payload.email.name === "console") {
    throw new PublicRequestRefusal(
      "Parola sıfırlama e-postası henüz yapılandırılmadı. Parolanızı başka bir yönetici sıfırlayabilir.",
    );
  }

  return args;
};

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    // Payload's default lets any signed-in user unlock any account, so an
    // editor could reset an admin's failed-login counter between guesses and
    // probe which emails have accounts. Only admins unlock.
    unlock: ({ req }) => isAdmin(req.user),
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
  auth: {
    cookies: {
      // Lax keeps the session for a top-level navigation from another site
      // (an admin link in an email) while browsers withhold the cookie from
      // cross-site POST, PATCH and DELETE requests. Secure on every HTTPS
      // (Vercel) deployment; plain-HTTP `next start` on localhost keeps working.
      sameSite: "Lax",
      secure: isHttpsDeployment(),
    },
    lockTime: LOGIN_LOCK_TIME_MS,
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
  },
  fields: [
    {
      name: "role",
      type: "select",
      access: {
        update: ({ req }) => isAdmin(req.user),
      },
      admin: {
        description:
          "Editor içerik ekler ve düzenler. Admin ayrıca kullanıcıları yönetir ve içerik siler. Sistemde her zaman en az bir Admin kalır.",
      },
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      required: true,
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeChange: [assignFirstUserAdminRole, preventDemotingLastAdmin],
    beforeDelete: [preventDeletingLastAdmin],
    beforeOperation: [refusePasswordResetWithoutEmail],
  },
};
