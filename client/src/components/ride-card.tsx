import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RideWithDriver } from "@shared/schema";
import { MapPin, Clock, Users, Banknote, Car, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

type RideCardProps = {
  ride: RideWithDriver;
  onBook?: () => void;
  onViewDetails?: () => void;
  showBookButton?: boolean;
  compact?: boolean;
};

export function RideCard({
  ride,
  onBook,
  onViewDetails,
  showBookButton = true,
  compact = false,
}: RideCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const departureDate = new Date(ride.departureTime);
  const isToday =
    new Date().toDateString() === departureDate.toDateString();
  const isTomorrow =
    new Date(Date.now() + 86400000).toDateString() === departureDate.toDateString();

  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : format(departureDate, "MMM d");

  if (compact) {
    return (
      <Card
        className="hover-elevate cursor-pointer transition-all"
        onClick={onViewDetails}
        data-testid={`card-ride-${ride.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={ride.driver?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(ride.driver?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{ride.driver?.name}</p>
                <Badge variant="secondary" className="shrink-0">
                  Rs. {ride.costPerSeat}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {dateLabel} at {format(departureDate, "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Users className="h-3 w-3" />
                <span>{ride.seatsAvailable} seats left</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid={`card-ride-${ride.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={ride.driver?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(ride.driver?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{ride.driver?.name}</p>
                {ride.driver?.cnicStatus === "verified" && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
              {ride.vehicle && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {ride.vehicle.model} - {ride.vehicle.color}
                </p>
              )}
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
            Rs. {ride.costPerSeat}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
              <div className="w-0.5 h-8 bg-border" />
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Pickup
                </p>
                <p className="font-medium truncate">{ride.sourceAddress}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Dropoff
                </p>
                <p className="font-medium truncate">{ride.destAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(departureDate, "h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              <span className="font-semibold text-primary">{ride.seatsAvailable}</span>
              /{ride.seatsTotal} seats
            </span>
          </div>
        </div>
      </CardContent>

      {showBookButton && (
        <CardFooter className="flex gap-2 pt-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewDetails}
            data-testid={`button-view-ride-${ride.id}`}
          >
            View Details
          </Button>
          <Button
            className="flex-1"
            onClick={onBook}
            disabled={ride.seatsAvailable === 0}
            data-testid={`button-book-ride-${ride.id}`}
          >
            {ride.seatsAvailable === 0 ? "Full" : "Request Seat"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
