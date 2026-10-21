"use client";

import { Link, useConfig } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import { formatAdminURL } from "payload/shared";

const label = "Yardım ve Kılavuz";

export default function AdminHelpNavLink() {
  const pathname = usePathname();
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const href = formatAdminURL({ adminRoute, path: "/help" });
  const isActive = pathname === href;
  const content = (
    <>
      {isActive ? <span className="nav__link-indicator" /> : null}
      <span className="nav__link-label">{label}</span>
    </>
  );

  return (
    <div className="nav-group">
      {isActive ? (
        <div aria-current="page" className="nav__link" id="nav-help">
          {content}
        </div>
      ) : (
        <Link className="nav__link" href={href} id="nav-help" prefetch={false}>
          {content}
        </Link>
      )}
    </div>
  );
}
