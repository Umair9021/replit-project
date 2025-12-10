import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RideCard } from "@/components/ride-card";
import { BookingCard } from "@/components/booking-card";
import { EmptyState } from "@/components/empty-state";
import { RideCardSkeleton, BookingCardSkeleton } from "@/components/loading-skeleton";
import { MapComponent } from "@/components/map-component";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RideWithDriver, BookingWithDetails } from "@shared/schema";
import {
  Plus,
  Car,
  Users,
  MapPin,
  Clock,
  Calendar,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

export default function MyRides() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRide, setSelectedRide] = useState<RideWithDriver | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<string | null>(null);

  const { data: rides, isLoading: ridesLoading } = useQuery<RideWithDriver[]>({
    queryKey: ["/api/rides"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
  });

  const myRides = rides?.filter((ride) => ride.driverId === user?.id) || [];
  const activeRides = myRides.filter((ride) => ride.isActive);
  const pastRides = myRides.filter((ride) => !ride.isActive);

  const pendingBookings = bookings?.filter(
    (b) => b.status === "pending" && myRides.some((r) => r.id === b.rideId)
  ) || [];

  const deleteRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      return apiRequest("DELETE", `/api/rides/${rideId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      toast({
        title: "Ride deleted",
        description: "Your ride has been removed successfully.",
      });
      setDeleteDialogOpen(false);
      setRideToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete ride",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleBookingAction = useMutation({
    mutationFn: async ({
      bookingId,
      action,
    }: {
      bookingId: string;
      action: "accept" | "reject";
    }) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}`, {
        status: action === "accept" ? "accepted" : "rejected",
      });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      toast({
        title: action === "accept" ? "Booking accepted" : "Booking rejected",
        description:
          action === "accept"
            ? "The passenger has been notified."
            : "The booking request has been declined.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = () => {
    if (rideToDelete) {
      deleteRideMutation.mutate(rideToDelete);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Rides</h1>
            <p className="text-muted-foreground">
              Manage your posted rides and booking requests
            </p>
          </div>
          <Link href="/post-ride">
            <Button className="gap-2" data-testid="button-post-ride">
              <Plus className="h-4 w-4" />
              Post New Ride
            </Button>
          </Link>
        </div>

        {pendingBookings.length > 0 && (
          <Card className="mb-8 border-yellow-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Pending Requests</CardTitle>
                <Badge className="bg-yellow-500/10 text-yellow-600">
                  {pendingBookings.length} new
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    viewAs="driver"
                    onAccept={() =>
                      handleBookingAction.mutate({
                        bookingId: booking.id,
                        action: "accept",
                      })
                    }
                    onReject={() =>
                      handleBookingAction.mutate({
                        bookingId: booking.id,
                        action: "reject",
                      })
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2" data-testid="tab-active-rides">
              <Car className="h-4 w-4" />
              Active ({activeRides.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2" data-testid="tab-past-rides">
              <Clock className="h-4 w-4" />
              Past ({pastRides.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {ridesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RideCardSkeleton />
                <RideCardSkeleton />
                <RideCardSkeleton />
              </div>
            ) : activeRides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeRides.map((ride) => (
                  <Card key={ride.id} data-testid={`card-my-ride-${ride.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-green-500/10 text-green-600">Active</Badge>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {ride.seatsAvailable}/{ride.seatsTotal}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div className="w-0.5 h-8 bg-border" />
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm font-medium truncate">
                            {ride.sourceAddress}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {ride.destAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(ride.departureTime), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(ride.departureTime), "h:mm a")}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold text-primary">
                          Rs. {ride.costPerSeat}
                          <span className="text-sm font-normal text-muted-foreground">
                            /seat
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRide(ride)}
                            data-testid={`button-view-ride-${ride.id}`}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              setRideToDelete(ride.id);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-ride-${ride.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Car}
                title="No active rides"
                description="Post a new ride to start connecting with passengers."
                action={{
                  label: "Post a Ride",
                  onClick: () => setLocation("/post-ride"),
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastRides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastRides.map((ride) => (
                  <Card key={ride.id} className="opacity-75">
                    <CardHeader className="pb-3">
                      <Badge variant="secondary">Completed</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                          <div className="w-0.5 h-8 bg-border" />
                          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm font-medium truncate">
                            {ride.sourceAddress}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {ride.destAddress}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(ride.departureTime), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No past rides"
                description="Your completed rides will appear here."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedRide} onOpenChange={() => setSelectedRide(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              <div className="h-48 rounded-lg overflow-hidden">
                <MapComponent
                  center={[selectedRide.sourceLat, selectedRide.sourceLng]}
                  zoom={10}
                  markers={[
                    {
                      position: [selectedRide.sourceLat, selectedRide.sourceLng],
                      label: "Pickup",
                      type: "source",
                    },
                    {
                      position: [selectedRide.destLat, selectedRide.destLng],
                      label: "Dropoff",
                      type: "destination",
                    },
                  ]}
                  routes={[
                    {
                      coordinates: [
                        [selectedRide.sourceLat, selectedRide.sourceLng],
                        [selectedRide.destLat, selectedRide.destLng],
                      ],
                    },
                  ]}
                  interactive={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{selectedRide.sourceAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dropoff</p>
                  <p className="font-medium">{selectedRide.destAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedRide.departureTime),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seats Available</p>
                  <p className="font-medium">
                    {selectedRide.seatsAvailable} of {selectedRide.seatsTotal}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ride?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All pending booking requests will be
              automatically rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
