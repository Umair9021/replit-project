import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BookingWithDetails } from "@shared/schema";
import { MapPin, Clock, Users, Banknote, Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";

type BookingCardProps = {
  booking: BookingWithDetails;
  viewAs: "passenger" | "driver";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
};

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  accepted: { label: "Accepted", variant: "secondary" as const, className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  rejected: { label: "Rejected", variant: "secondary" as const, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  cancelled: { label: "Cancelled", variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
};

export function BookingCard({
  booking,
  viewAs,
  onAccept,
  onReject,
  onCancel,
}: BookingCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const status = statusConfig[booking.status];
  const departureDate = new Date(booking.ride.departureTime);
  const isToday = new Date().toDateString() === departureDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === departureDate.toDateString();
  const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : format(departureDate, "MMM d");

  const displayUser = viewAs === "driver" ? booking.passenger : booking.driver;
  const userLabel = viewAs === "driver" ? "Passenger" : "Driver";

  return (
    <Card className="overflow-hidden" data-testid={`card-booking-${booking.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={displayUser?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(displayUser?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">{userLabel}</p>
              <p className="font-semibold">{displayUser?.name}</p>
              {displayUser?.email && (
                <p className="text-sm text-muted-foreground">{displayUser.email}</p>
              )}
            </div>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pickup</p>
                <p className="font-medium truncate">{booking.ride.sourceAddress}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Dropoff</p>
                <p className="font-medium truncate">{booking.ride.destAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
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
            <span>{booking.seatsBooked} seat(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>Rs. {booking.ride.costPerSeat * booking.seatsBooked}</span>
          </div>
        </div>
      </CardContent>

      {booking.status === "pending" && (
        <CardFooter className="flex gap-2 pt-0">
          {viewAs === "driver" ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onReject}
                data-testid={`button-reject-booking-${booking.id}`}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={onAccept}
                data-testid={`button-accept-booking-${booking.id}`}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              data-testid={`button-cancel-booking-${booking.id}`}
            >
              Cancel Request
            </Button>
          )}
        </CardFooter>
      )}

      {booking.status === "accepted" && viewAs === "passenger" && (
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            data-testid={`button-cancel-booking-${booking.id}`}
          >
            Cancel Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
