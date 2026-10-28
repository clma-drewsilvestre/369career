import type { Metadata } from "next";
import AssessmentFlow from "@/components/AssessmentFlow";

export const metadata: Metadata = {
  title: "Take the snapshot",
  // The questions themselves are not a useful search landing page — send
  // crawlers to `/` instead.
  robots: { index: false, follow: true },
};

export default function AssessmentPage() {
  return <AssessmentFlow />;
}
