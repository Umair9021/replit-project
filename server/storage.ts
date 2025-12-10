import type { User, InsertUser, Vehicle, InsertVehicle, Ride, InsertRide, Booking, InsertBooking, RideWithDriver, BookingWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";

type SafeUser = Omit<User, 'password'>;

function stripPassword(user: User): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Vehicles
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehiclesByOwner(ownerId: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  
  // Rides
  getRide(id: string): Promise<Ride | undefined>;
  getRideWithDriver(id: string): Promise<RideWithDriver | undefined>;
  getAllRides(): Promise<RideWithDriver[]>;
  getRidesByDriver(driverId: string): Promise<RideWithDriver[]>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: string, data: Partial<Ride>): Promise<Ride | undefined>;
  deleteRide(id: string): Promise<boolean>;
  
  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined>;
  getAllBookings(): Promise<BookingWithDetails[]>;
  getBookingsByPassenger(passengerId: string): Promise<BookingWithDetails[]>;
  getBookingsByRide(rideId: string): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined>;
  
  // Stats
  getDriverStats(driverId: string): Promise<{
    totalRides: number;
    activeRides: number;
    totalBookings: number;
    totalEarnings: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vehicles: Map<string, Vehicle>;
  private rides: Map<string, Ride>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.rides = new Map();
    this.bookings = new Map();
    
    this.seedData();
  }

  private seedData() {
    const demoDriver: User = {
      id: "driver-1",
      clerkId: null,
      name: "Ahmed Khan",
      email: "ahmed.khan@university.edu.pk",
      password: "password123",
      role: "driver",
      avatar: null,
      phone: "0300-1234567",
      cnic: null,
      cnicStatus: "verified",
      isAdmin: false,
    };

    const demoDriver2: User = {
      id: "driver-2",
      clerkId: null,
      name: "Sara Ahmed",
      email: "sara.ahmed@university.edu.pk",
      password: "password123",
      role: "both",
      avatar: null,
      phone: "0301-2345678",
      cnic: null,
      cnicStatus: "verified",
      isAdmin: false,
    };

    const demoPassenger: User = {
      id: "passenger-1",
      clerkId: null,
      name: "Ali Raza",
      email: "ali.raza@university.edu.pk",
      password: "password123",
      role: "passenger",
      avatar: null,
      phone: "0302-3456789",
      cnic: null,
      cnicStatus: "not_uploaded",
      isAdmin: false,
    };

    this.users.set(demoDriver.id, demoDriver);
    this.users.set(demoDriver2.id, demoDriver2);
    this.users.set(demoPassenger.id, demoPassenger);

    const vehicle1: Vehicle = {
      id: "vehicle-1",
      ownerId: "driver-1",
      model: "Toyota Corolla 2020",
      plate: "ABC-1234",
      color: "White",
      seats: 4,
    };

    const vehicle2: Vehicle = {
      id: "vehicle-2",
      ownerId: "driver-2",
      model: "Honda Civic 2019",
      plate: "XYZ-5678",
      color: "Silver",
      seats: 4,
    };

    this.vehicles.set(vehicle1.id, vehicle1);
    this.vehicles.set(vehicle2.id, vehicle2);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);

    const ride1: Ride = {
      id: "ride-1",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      sourceLat: 33.2451,
      sourceLng: 72.4192,
      sourceAddress: "Pindi Gheb Main Chowk, Punjab",
      destLat: 33.6844,
      destLng: 73.0479,
      destAddress: "University Campus, Islamabad",
      departureTime: tomorrow,
      seatsTotal: 3,
      seatsAvailable: 2,
      costPerSeat: 300,
      isActive: true,
    };

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(8, 30, 0, 0);

    const ride2: Ride = {
      id: "ride-2",
      driverId: "driver-2",
      vehicleId: "vehicle-2",
      sourceLat: 33.2651,
      sourceLng: 72.4092,
      sourceAddress: "Pindi Gheb Bus Stand, Punjab",
      destLat: 33.6744,
      destLng: 73.0679,
      destAddress: "University Gate 1, Islamabad",
      departureTime: dayAfterTomorrow,
      seatsTotal: 4,
      seatsAvailable: 4,
      costPerSeat: 350,
      isActive: true,
    };

    const todayEvening = new Date();
    todayEvening.setHours(17, 0, 0, 0);

    const ride3: Ride = {
      id: "ride-3",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      sourceLat: 33.6844,
      sourceLng: 73.0479,
      sourceAddress: "University Campus, Islamabad",
      destLat: 33.2451,
      destLng: 72.4192,
      destAddress: "Pindi Gheb Main Chowk, Punjab",
      departureTime: todayEvening,
      seatsTotal: 3,
      seatsAvailable: 3,
      costPerSeat: 300,
      isActive: true,
    };

    this.rides.set(ride1.id, ride1);
    this.rides.set(ride2.id, ride2);
    this.rides.set(ride3.id, ride3);

    const booking1: Booking = {
      id: "booking-1",
      rideId: "ride-1",
      passengerId: "passenger-1",
      status: "accepted",
      seatsBooked: 1,
    };

    this.bookings.set(booking1.id, booking1);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.ownerId === ownerId
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { id, ...insertVehicle };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    const updated = { ...vehicle, ...data };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async getRide(id: string): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getRideWithDriver(id: string): Promise<RideWithDriver | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;
    
    const driver = await this.getUser(ride.driverId);
    if (!driver) return undefined;
    
    const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
    const bookings = await this.getBookingsByRideInternal(id);
    
    return {
      ...ride,
      driver: stripPassword(driver) as User,
      vehicle,
      bookingsCount: bookings.length,
    };
  }

  async getAllRides(): Promise<RideWithDriver[]> {
    const rides = Array.from(this.rides.values()).filter((r) => r.isActive);
    const ridesWithDrivers: RideWithDriver[] = [];
    
    for (const ride of rides) {
      const driver = await this.getUser(ride.driverId);
      if (!driver) continue;
      
      const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
      const bookings = await this.getBookingsByRideInternal(ride.id);
      
      ridesWithDrivers.push({
        ...ride,
        driver: stripPassword(driver) as User,
        vehicle,
        bookingsCount: bookings.length,
      });
    }
    
    return ridesWithDrivers.sort(
      (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }

  async getRidesByDriver(driverId: string): Promise<RideWithDriver[]> {
    const rides = Array.from(this.rides.values()).filter(
      (r) => r.driverId === driverId
    );
    const ridesWithDrivers: RideWithDriver[] = [];
    
    for (const ride of rides) {
      const driver = await this.getUser(ride.driverId);
      if (!driver) continue;
      
      const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
      const bookings = await this.getBookingsByRideInternal(ride.id);
      
      ridesWithDrivers.push({
        ...ride,
        driver: stripPassword(driver) as User,
        vehicle,
        bookingsCount: bookings.length,
      });
    }
    
    return ridesWithDrivers;
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const id = randomUUID();
    const ride: Ride = { id, ...insertRide };
    this.rides.set(id, ride);
    return ride;
  }

  async updateRide(id: string, data: Partial<Ride>): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;
    const updated = { ...ride, ...data };
    this.rides.set(id, updated);
    return updated;
  }

  async deleteRide(id: string): Promise<boolean> {
    const bookings = await this.getBookingsByRideInternal(id);
    for (const booking of bookings) {
      if (booking.status === "pending") {
        await this.updateBooking(booking.id, { status: "rejected" });
      }
    }
    return this.rides.delete(id);
  }

  private async getBookingsByRideInternal(rideId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (b) => b.rideId === rideId
    );
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const ride = await this.getRide(booking.rideId);
    if (!ride) return undefined;
    
    const passenger = await this.getUser(booking.passengerId);
    if (!passenger) return undefined;
    
    const driver = await this.getUser(ride.driverId);
    
    return {
      ...booking,
      ride,
      passenger: stripPassword(passenger) as User,
      driver: driver ? stripPassword(driver) as User : undefined,
    };
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const bookings = Array.from(this.bookings.values());
    const bookingsWithDetails: BookingWithDetails[] = [];
    
    for (const booking of bookings) {
      const details = await this.getBookingWithDetails(booking.id);
      if (details) {
        bookingsWithDetails.push(details);
      }
    }
    
    return bookingsWithDetails;
  }

  async getBookingsByPassenger(passengerId: string): Promise<BookingWithDetails[]> {
    const bookings = Array.from(this.bookings.values()).filter(
      (b) => b.passengerId === passengerId
    );
    const bookingsWithDetails: BookingWithDetails[] = [];
    
    for (const booking of bookings) {
      const details = await this.getBookingWithDetails(booking.id);
      if (details) {
        bookingsWithDetails.push(details);
      }
    }
    
    return bookingsWithDetails;
  }

  async getBookingsByRide(rideId: string): Promise<BookingWithDetails[]> {
    const bookings = Array.from(this.bookings.values()).filter(
      (b) => b.rideId === rideId
    );
    const bookingsWithDetails: BookingWithDetails[] = [];
    
    for (const booking of bookings) {
      const details = await this.getBookingWithDetails(booking.id);
      if (details) {
        bookingsWithDetails.push(details);
      }
    }
    
    return bookingsWithDetails;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { id, ...insertBooking };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updated = { ...booking, ...data };
    this.bookings.set(id, updated);
    
    if (data.status === "accepted") {
      const ride = await this.getRide(booking.rideId);
      if (ride) {
        await this.updateRide(ride.id, {
          seatsAvailable: Math.max(0, ride.seatsAvailable - booking.seatsBooked),
        });
      }
    }
    
    if (data.status === "cancelled" && booking.status === "accepted") {
      const ride = await this.getRide(booking.rideId);
      if (ride) {
        await this.updateRide(ride.id, {
          seatsAvailable: ride.seatsAvailable + booking.seatsBooked,
        });
      }
    }
    
    return updated;
  }

  async getDriverStats(driverId: string): Promise<{
    totalRides: number;
    activeRides: number;
    totalBookings: number;
    totalEarnings: number;
  }> {
    const rides = Array.from(this.rides.values()).filter(
      (r) => r.driverId === driverId
    );
    const activeRides = rides.filter((r) => r.isActive);
    
    let totalBookings = 0;
    let totalEarnings = 0;
    
    for (const ride of rides) {
      const bookings = Array.from(this.bookings.values()).filter(
        (b) => b.rideId === ride.id && b.status === "accepted"
      );
      totalBookings += bookings.length;
      totalEarnings += bookings.reduce(
        (sum, b) => sum + b.seatsBooked * ride.costPerSeat,
        0
      );
    }
    
    return {
      totalRides: rides.length,
      activeRides: activeRides.length,
      totalBookings,
      totalEarnings,
    };
  }
}

export const storage = new MemStorage();
