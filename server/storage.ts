// server/storage.ts
import type { User, InsertUser, Vehicle, InsertVehicle, Ride, InsertRide, Booking, InsertBooking, RideWithDriver, BookingWithDetails, InsertReview, Review } from "@shared/schema";
import { UserModel, VehicleModel, RideModel, BookingModel, ReviewModel } from "./db";
import { randomUUID } from "crypto";

function stripPassword(user: any): User {
  const { password, ...safeUser } = user;
  return safeUser as User;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
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
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  getDriverAverageRating(driverId: string): Promise<number>;

  // Stats
  getDriverStats(driverId: string): Promise<{
    totalRides: number;
    activeRides: number;
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
  }>;
}

export class MongoStorage implements IStorage {
  
  private mapDoc<T>(doc: any): T {
    if (!doc) return undefined as any;
    const obj = doc.toObject();
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return obj as T;
  }

  // --- Helper for Missing Drivers ---
  private getSafeDriver(driver: User | undefined, driverId: string): User {
    if (driver) return stripPassword(driver);
    return {
      id: driverId,
      name: "Unknown Driver",
      email: "missing@data.com",
      role: "driver",
      cnicStatus: "not_uploaded",
      isAdmin: false,
      clerkId: null,
      avatar: null,
      phone: null,
      cnic: null,
      password: "" 
    } as User;
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id);
    return doc ? this.mapDoc<User>(doc) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ email });
    return doc ? this.mapDoc<User>(doc) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const doc = await UserModel.create({ _id: id, ...insertUser } as any);
    return this.mapDoc<User>(doc);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const doc = await UserModel.findByIdAndUpdate(id, data as any, { new: true });
    return doc ? this.mapDoc<User>(doc) : undefined;
  }

  // --- Vehicles ---
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const doc = await VehicleModel.findById(id);
    return doc ? this.mapDoc<Vehicle>(doc) : undefined;
  }

  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    const docs = await VehicleModel.find({ ownerId });
    return docs.map(d => this.mapDoc<Vehicle>(d));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const doc = await VehicleModel.create({ _id: id, ...insertVehicle } as any);
    return this.mapDoc<Vehicle>(doc);
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const doc = await VehicleModel.findByIdAndUpdate(id, data as any, { new: true });
    return doc ? this.mapDoc<Vehicle>(doc) : undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await VehicleModel.findByIdAndDelete(id);
    return !!result;
  }

  // --- Rides ---
  async getRide(id: string): Promise<Ride | undefined> {
    const doc = await RideModel.findById(id);
    return doc ? this.mapDoc<Ride>(doc) : undefined;
  }

  async getRideWithDriver(id: string): Promise<RideWithDriver | undefined> {
    const ride = await this.getRide(id);
    if (!ride) return undefined;
    
    const driver = await this.getUser(ride.driverId);
    const safeDriver = this.getSafeDriver(driver, ride.driverId);
    
    const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
    const bookings = await BookingModel.find({ rideId: id });
    
    return {
      ...ride,
      driver: safeDriver,
      vehicle,
      bookingsCount: bookings.length,
    };
  }

  async getAllRides(): Promise<RideWithDriver[]> {
    const rides = await RideModel.find({ isActive: true }).sort({ departureTime: 1 });
    const results: RideWithDriver[] = [];

    for (const r of rides) {
      const ride = this.mapDoc<Ride>(r);
      const driver = await this.getUser(ride.driverId);
      const safeDriver = this.getSafeDriver(driver, ride.driverId);
      
      const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
      const bookingsCount = await BookingModel.countDocuments({ rideId: ride.id });
      
      results.push({
        ...ride,
        driver: safeDriver,
        vehicle,
        bookingsCount,
      });
    }
    return results;
  }

  async getRidesByDriver(driverId: string): Promise<RideWithDriver[]> {
    const rides = await RideModel.find({ driverId });
    const results: RideWithDriver[] = [];

    for (const r of rides) {
      const ride = this.mapDoc<Ride>(r);
      const driver = await this.getUser(driverId);
      const safeDriver = this.getSafeDriver(driver, driverId);
      
      const vehicle = ride.vehicleId ? await this.getVehicle(ride.vehicleId) : undefined;
      const bookingsCount = await BookingModel.countDocuments({ rideId: ride.id });
      
      results.push({
        ...ride,
        driver: safeDriver,
        vehicle,
        bookingsCount,
      });
    }
    return results;
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const id = randomUUID();
    const doc = await RideModel.create({ _id: id, ...insertRide } as any);
    return this.mapDoc<Ride>(doc);
  }

  async updateRide(id: string, data: Partial<Ride>): Promise<Ride | undefined> {
    const doc = await RideModel.findByIdAndUpdate(id, data as any, { new: true });
    return doc ? this.mapDoc<Ride>(doc) : undefined;
  }

  async deleteRide(id: string): Promise<boolean> {
    const bookings = await BookingModel.find({ rideId: id, status: "pending" });
    for (const booking of bookings) {
      await BookingModel.findByIdAndUpdate(booking._id, { status: "rejected" });
    }
    const result = await RideModel.findByIdAndDelete(id);
    return !!result;
  }

  // --- Bookings ---
  async getBooking(id: string): Promise<Booking | undefined> {
    const doc = await BookingModel.findById(id);
    return doc ? this.mapDoc<Booking>(doc) : undefined;
  }

  async getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined> {
    const booking = await this.getBooking(id);
    if (!booking) return undefined;

    const ride = await this.getRide(booking.rideId);
    if (!ride) return undefined;

    const passenger = await this.getUser(booking.passengerId);
    const safePassenger = this.getSafeDriver(passenger, booking.passengerId);

    const driver = await this.getUser(ride.driverId);
    const safeDriver = driver ? stripPassword(driver) : undefined;

    return {
      ...booking,
      ride,
      passenger: safePassenger,
      driver: safeDriver,
    };
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    // 1. Fetch all bookings with populated fields
    const bookings = await BookingModel.find()
      .populate('passengerId')
      .populate({
        path: 'rideId',
        populate: { path: 'driverId' }
      })
      .sort({ _id: -1 })
      .lean();

    // 2. Manual Lookup: Attach the 'review' object if it exists
    const results = await Promise.all(bookings.map(async (booking: any) => {
      // ✅ FIX: Safety check for broken references (Deleted Rides/Passengers)
      // If booking.rideId or passengerId is null (populated failed), we skip review lookup to prevent crash
      const rideId = booking.rideId?._id;
      const reviewerId = booking.passengerId?._id;
      
      let review = null;
      if (rideId && reviewerId) {
         review = await ReviewModel.findOne({
          rideId: rideId,
          reviewerId: reviewerId
        });
      }
      
      return { ...booking, review };
    }));

    return results as BookingWithDetails[];
  }

  async getBookingsByPassenger(passengerId: string): Promise<BookingWithDetails[]> {
    const bookings = await BookingModel.find({ passengerId });
    const results: BookingWithDetails[] = [];
    for (const b of bookings) {
      const details = await this.getBookingWithDetails(b._id as string);
      if (details) results.push(details);
    }
    return results;
  }

  async getBookingsByRide(rideId: string): Promise<BookingWithDetails[]> {
    const bookings = await BookingModel.find({ rideId });
    const results: BookingWithDetails[] = [];
    for (const b of bookings) {
      const details = await this.getBookingWithDetails(b._id as string);
      if (details) results.push(details);
    }
    return results;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const doc = await BookingModel.create({ _id: id, ...insertBooking } as any);
    return this.mapDoc<Booking>(doc);
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined> {
    // 1. Get the OLD status to check for transitions
    const existingBooking = await this.getBooking(id);
    if (!existingBooking) return undefined;

    const doc = await BookingModel.findByIdAndUpdate(id, data as any, { new: true });
    const booking = doc ? this.mapDoc<Booking>(doc) : undefined;

    if (booking) {
        const ride = await this.getRide(booking.rideId);
        
        if (ride) {
            // ✅ FIX: Removed double deduction on "accepted"
            // (Seats are already deducted on creation in routes.ts)

            // ✅ FIX: Add refund logic for "rejected"
            if (data.status === "rejected" && existingBooking.status === "pending") {
                await this.updateRide(ride.id, {
                    seatsAvailable: ride.seatsAvailable + booking.seatsBooked,
                });
            }

            // Refund logic for "cancelled"
            if (data.status === "cancelled" && (existingBooking.status === "accepted" || existingBooking.status === "pending")) {
                await this.updateRide(ride.id, {
                    seatsAvailable: ride.seatsAvailable + booking.seatsBooked,
                });
            }
        }
    }
    
    return booking;
  }

  // --- REVIEWS & STATS ---
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const doc = await ReviewModel.create({ _id: id, ...insertReview } as any);
    return this.mapDoc<Review>(doc);
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({ revieweeId: userId }).sort({ createdAt: -1 });
    return docs.map(d => this.mapDoc<Review>(d));
  }

  async getDriverAverageRating(driverId: string): Promise<number> {
    const reviews = await ReviewModel.find({ revieweeId: driverId });
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }
  
  async deleteUser(id: string): Promise<boolean> {
    try {
      // 1. Get all rides by this driver to delete them properly
      const driverRides = await RideModel.find({ driverId: id });
      
      // 2. Parallelize the deletion of related data
      await Promise.all([
        // A. Delete all rides (this should ideally trigger booking refunds/cancellations logic if needed)
        ...driverRides.map(ride => this.deleteRide(ride._id as string)),

        // B. Delete all bookings MADE by this user (as a passenger)
        BookingModel.deleteMany({ passengerId: id }),

        // C. Delete all vehicles owned by this user
        VehicleModel.deleteMany({ ownerId: id }),

        // D. Delete reviews written by this user
        ReviewModel.deleteMany({ reviewerId: id }),
        
        // E. (Optional) Delete reviews WRITTEN ABOUT this user? 
        // Usually better to keep them for record, but for full wipe:
        ReviewModel.deleteMany({ revieweeId: id }) 
      ]);

      // 3. Finally, delete the user profile
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getDriverStats(driverId: string): Promise<{
    totalRides: number;
    activeRides: number;
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
  }> {
    const rides = await RideModel.find({ driverId });
    const activeRides = rides.filter(r => r.isActive).length;
    
    let totalBookings = 0;
    let totalEarnings = 0;

    for (const ride of rides) {
       const bookings = await BookingModel.find({ rideId: ride._id, status: 'accepted' });
       totalBookings += bookings.length;
       const seats = bookings.reduce((sum, b) => sum + (b.seatsBooked || 1), 0);
       totalEarnings += seats * ride.costPerSeat;
    }

    const averageRating = await this.getDriverAverageRating(driverId);

    return {
      totalRides: rides.length,
      activeRides,
      totalBookings,
      totalEarnings,
      averageRating
    };
  }
}

export const storage = new MongoStorage();