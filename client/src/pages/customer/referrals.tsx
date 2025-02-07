import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ReferralStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  referralCode: string;
  referrals: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    referralCount: number;
  }>;
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referralStats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/customer/referrals"],
    queryFn: async () => {
      const response = await fetch("/api/customer/referrals", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch referral data");
      }
      return response.json();
    },
  });

  const referralLink = referralStats?.referralCode 
    ? `${window.location.origin}/auth?ref=${referralStats.referralCode}`
    : '';

  const copyToClipboard = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Success",
        description: "Referral link copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy referral link",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Referrals</h1>

      {/* Prominent Referral Link Card */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Share this link with others to earn referral points. You'll receive points when they sign up and start participating!
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className={copied ? "text-green-500" : ""}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Level 1 Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referralStats?.level1Count || 0}</div>
            <p className="text-sm text-muted-foreground">Direct referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level 2 Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referralStats?.level2Count || 0}</div>
            <p className="text-sm text-muted-foreground">Your referrals' referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level 3 Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referralStats?.level3Count || 0}</div>
            <p className="text-sm text-muted-foreground">Level 2's referrals</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Direct Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {referralStats?.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {referral.firstName} {referral.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {referral.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {referral.referralCount} referrals
                  </Badge>
                </div>
              ))}
              {(!referralStats?.referrals || referralStats.referrals.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No referrals yet. Share your referral link to get started!
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}