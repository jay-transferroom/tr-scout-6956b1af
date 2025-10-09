import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp } from "lucide-react";

interface HeadCoachCardProps {
  coach: {
    shortname: string | null;
    Image: string | null;
    current_Role: string | null;
    age: number | null;
    rating: number | null;
    Style: string | null;
    "Favourite Formation": string | null;
    TrustInYouth: number | null;
  };
}

const HeadCoachCard = ({ coach }: HeadCoachCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Head Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={coach.Image || undefined} alt={coach.shortname || "Coach"} />
            <AvatarFallback className="text-lg">
              {coach.shortname ? getInitials(coach.shortname) : "HC"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold">{coach.shortname || "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">
                {coach.current_Role} {coach.age ? `• ${coach.age} years old` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {coach.rating && (
                <Badge variant="secondary">
                  Rating: {coach.rating}
                </Badge>
              )}
              {coach.Style && (
                <Badge variant="outline">
                  {coach.Style}
                </Badge>
              )}
              {coach["Favourite Formation"] && (
                <Badge variant="outline">
                  Prefers {coach["Favourite Formation"]}
                </Badge>
              )}
            </div>

            {coach.TrustInYouth !== null && coach.TrustInYouth !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Trust in Youth: <span className="font-medium text-foreground">{coach.TrustInYouth.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeadCoachCard;
