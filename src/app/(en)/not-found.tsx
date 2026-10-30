import type { Metadata } from "next";
import NotFoundScreen from "@/components/layout/NotFoundScreen";

export const metadata: Metadata = {
  title: "Page not found | Şaban Durali",
  description: "The requested page was not found.",
};

export default function EnglishNotFound() {
  return <NotFoundScreen locale="en" />;
}
