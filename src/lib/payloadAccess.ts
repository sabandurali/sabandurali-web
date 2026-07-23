import type { Access, Where } from "payload";

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

  const publicArticleWhere: Where = {
    and: [
      {
        _status: {
          equals: "published",
        },
      },
      {
        publishedAt: {
          less_than_equal: new Date().toISOString(),
        },
      },
    ],
  };

  return publicArticleWhere;
};

export const publishedBookReviewOrAdminOrEditor: Access = ({ req }) => {
  if (isAdminOrEditor(req.user)) return true;

  const publicBookReviewWhere: Where = {
    and: [
      {
        _status: {
          equals: "published",
        },
      },
      {
        reviewStatus: {
          equals: "published",
        },
      },
      {
        publishedAt: {
          less_than_equal: new Date().toISOString(),
        },
      },
      {
        "seo.index": {
          equals: true,
        },
      },
    ],
  };

  return publicBookReviewWhere;
};
