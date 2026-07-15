import AssessmentFlow from "@/components/AssessmentFlow";

export default function StartPage() {
  return (
    <AssessmentFlow
      moment="start"
      webhookUrl={process.env.NEXT_PUBLIC_MAKE_WEBHOOK_START}
      title="369 Career Readiness Snapshot"
      description="A 90-second check-in before we begin. Answer honestly — there's no wrong score."
      includeBatch
      includeTrack
      resultHeading="Your Starting Snapshot"
      resultCopy="Screenshot this. You'll need it again in a few hours."
    />
  );
}
