import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referralInfo } = useQuery({
    queryKey: ["/api/customer/referral"],
  });

  const referralLink = `${window.location.origin}/register?ref=${referralInfo?.referralCode}`;

  const copyToClipboard = async () => {
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
    <Card>
      <CardHeader>
        <CardTitle>Refer & Earn Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Share your referral link with friends. When they register, you'll earn 2,500 points!
        </div>
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
        {referralInfo?.referralCount > 0 && (
          <div className="text-sm">
            <span className="font-medium">{referralInfo.referralCount}</span> successful referrals
          </div>
        )}
      </CardContent>
    </Card>
  );
}
