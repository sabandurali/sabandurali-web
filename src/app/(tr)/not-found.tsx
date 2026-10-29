import type { Metadata } from "next";
import NotFoundScreen from "@/components/layout/NotFoundScreen";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı | Şaban Durali",
  description: "İstenen sayfa bulunamadı.",
};

export default function TurkishNotFound() {
  return <NotFoundScreen locale="tr" />;
}
