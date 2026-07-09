import AssessmentFlow from "@/components/AssessmentFlow";

export default function EndPage() {
  return (
    <AssessmentFlow
      moment="end"
      webhookUrl={process.env.NEXT_PUBLIC_MAKE_WEBHOOK_END}
      title="369 Career Readiness Snapshot"
      description="One more 2-minute check-in, now that the workshop is wrapping up."
      includeBatch
      includeTrack={false}
      resultHeading="Your Finishing Snapshot"
      resultCopy="Here's where you're finishing today."
    />
  );
}
