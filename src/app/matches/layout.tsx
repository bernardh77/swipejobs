import MatchesShell from "@/components/matches/MatchesShell";

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MatchesShell>{children}</MatchesShell>;
}
