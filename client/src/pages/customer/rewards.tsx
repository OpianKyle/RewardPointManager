import { useQuery } from "@tanstack/react-query";
import RewardCard from "@/components/shared/reward-card";
import PointsDisplay from "@/components/shared/points-display";

export default function CustomerRewards() {
  const { data: user } = useQuery({
    queryKey: ["/api/customer/points"],
  });

  const { data: rewards } = useQuery({
    queryKey: ["/api/rewards"],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Rewards</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Your Points:</span>
          <PointsDisplay points={user?.points || 0} size="small" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rewards?.map((reward: any) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            userPoints={user?.points || 0}
          />
        ))}
      </div>
    </div>
  );
}
