import { Redirect } from "expo-router";

// Legacy route kept so existing links keep working. The trial is now offered
// on the plans screen (first-run mode) alongside the paid plans.
export default function StartTrial() {
  return <Redirect href={{ pathname: "/subscription", params: { firstRun: "1" } } as any} />;
}
