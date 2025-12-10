import { useState, Suspense, lazy } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RoleToggle } from "@/components/role-toggle";
import { RideCard } from "@/components/ride-card";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { RideCardSkeleton, StatCardSkeleton, MapSkeleton } from "@/components/loading-skeleton";
import { MapComponent } from "@/components/map-component";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RideWithDriver, Ride } from "@shared/schema";
import {
  Search,
  MapPin,
  Plus,
  Car,
  Users,
  Banknote,
  TrendingUp,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";

export default function Dashboard() {
  const { user, activeRole } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRide, setSelectedRide] = useState<RideWithDriver | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const { data: rides, isLoading: ridesLoading } = useQuery<RideWithDriver[]>({
    queryKey: ["/api/rides"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRides: number;
    totalBookings: number;
    totalEarnings: number;
    activeRides: number;
  }>({
    queryKey: ["/api/stats", user?.id],
    enabled: !!user?.id,
  });

  const bookingMutation = useMutation({
    mutationFn: async (rideId: string) => {
      return apiRequest("POST", "/api/bookings", {
        rideId,
        passengerId: user?.id,
        seatsBooked: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking requested!",
        description: "The driver will review your request.",
      });
      setBookingDialogOpen(false);
      setSelectedRide(null);
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const filteredRides = rides?.filter((ride) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ride.sourceAddress.toLowerCase().includes(query) ||
      ride.destAddress.toLowerCase().includes(query) ||
      ride.driver?.name.toLowerCase().includes(query)
    );
  });

  const handleBookRide = (ride: RideWithDriver) => {
    setSelectedRide(ride);
    setBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    if (selectedRide) {
      bookingMutation.mutate(selectedRide.id);
    }
  };

  const mapMarkers = filteredRides?.flatMap((ride) => [
    {
      position: [ride.sourceLat, ride.sourceLng] as [number, number],
      label: `Pickup: ${ride.sourceAddress}`,
      type: "source" as const,
    },
    {
      position: [ride.destLat, ride.destLng] as [number, number],
      label: `Dropoff: ${ride.destAddress}`,
      type: "destination" as const,
    },
  ]) || [];

  if (activeRole === "driver") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Driver Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your rides and track earnings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RoleToggle />
              <Link href="/post-ride">
                <Button className="gap-2" data-testid="button-post-ride">
                  <Plus className="h-4 w-4" />
                  Post New Ride
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Rides"
                  value={stats?.totalRides || 0}
                  icon={Car}
                />
                <StatCard
                  title="Active Rides"
                  value={stats?.activeRides || 0}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Total Bookings"
                  value={stats?.totalBookings || 0}
                  icon={Users}
                />
                <StatCard
                  title="Earnings"
                  value={`Rs. ${stats?.totalEarnings || 0}`}
                  icon={Banknote}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Your Rides</CardTitle>
                  <Link href="/my-rides">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {ridesLoading ? (
                    <div className="space-y-4">
                      <RideCardSkeleton />
                      <RideCardSkeleton />
                    </div>
                  ) : filteredRides && filteredRides.filter(r => r.driverId === user?.id).length > 0 ? (
                    <div className="space-y-4">
                      {filteredRides
                        .filter((r) => r.driverId === user?.id)
                        .slice(0, 3)
                        .map((ride) => (
                          <RideCard
                            key={ride.id}
                            ride={ride}
                            showBookButton={false}
                            compact
                            onViewDetails={() => setLocation(`/my-rides`)}
                          />
                        ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Car}
                      title="No rides yet"
                      description="Start by posting your first ride to connect with passengers."
                      action={{
                        label: "Post a Ride",
                        onClick: () => setLocation("/post-ride"),
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/post-ride" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      Post New Ride
                    </Button>
                  </Link>
                  <Link href="/my-rides" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Car className="h-4 w-4" />
                      Manage Rides
                    </Button>
                  </Link>
                  <Link href="/bookings" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      View Bookings
                    </Button>
                  </Link>
                  <Link href="/vehicles" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Car className="h-4 w-4" />
                      My Vehicles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <div className="lg:w-2/5 xl:w-1/3 p-4 lg:p-6 border-r overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Find a Ride</h1>
              <p className="text-sm text-muted-foreground">
                Search available rides near you
              </p>
            </div>
            <RoleToggle />
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-rides"
            />
          </div>

          <ScrollArea className="flex-1 -mr-4 pr-4">
            {ridesLoading ? (
              <div className="space-y-4">
                <RideCardSkeleton />
                <RideCardSkeleton />
                <RideCardSkeleton />
              </div>
            ) : filteredRides && filteredRides.length > 0 ? (
              <div className="space-y-4 pb-4">
                {filteredRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onBook={() => handleBookRide(ride)}
                    onViewDetails={() => setSelectedRide(ride)}
                    showBookButton
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MapPin}
                title="No rides available"
                description="Check back later or try a different search."
              />
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 p-4 lg:p-0 h-[400px] lg:h-full">
          <MapComponent
            center={[33.6844, 73.0479]}
            zoom={9}
            markers={mapMarkers}
            className="h-full lg:rounded-none"
          />
        </div>
      </div>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              You are about to request a seat on this ride.
            </DialogDescription>
          </DialogHeader>

          {selectedRide && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">From:</span>{" "}
                    {selectedRide.sourceAddress}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">To:</span>{" "}
                    {selectedRide.destAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Cost per seat</span>
                <span className="text-2xl font-bold text-primary">
                  Rs. {selectedRide.costPerSeat}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              data-testid="button-cancel-booking-dialog"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBooking}
              disabled={bookingMutation.isPending}
              data-testid="button-confirm-booking"
            >
              {bookingMutation.isPending ? "Requesting..." : "Request Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
