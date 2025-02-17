import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Referral {
  id: number;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  referrals: Referral[];
}

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referralInfo, isLoading, error } = useQuery<ReferralInfo>({
    queryKey: ["/api/customer/referral"],
    queryFn: async () => {
      const response = await fetch("/api/customer/referral", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch referral data");
      }
      return response.json();
    },
  });

  const referralLink = referralInfo?.referralCode 
    ? `${window.location.origin}/?ref=${referralInfo.referralCode}`
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refer & Earn Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refer & Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load referral information. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refer & Earn Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Share your referral link with friends. When they register, you'll earn 2,500 points!
        </div>
        {referralLink && (
          <div className="flex items-center gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
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
        )}
        {referralInfo?.referralCount > 0 && (
          <div className="text-sm">
            <span className="font-medium">{referralInfo.referralCount}</span> successful referrals
          </div>
        )}
        {referralInfo?.referrals?.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Referrals</div>
            <div className="space-y-2">
              {referralInfo.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="text-sm p-2 bg-muted rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{referral.firstName} {referral.lastName}</span>
                    <span className="text-muted-foreground"> joined on </span>
                    <span>{new Date(referral.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline">+2,500 points</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}