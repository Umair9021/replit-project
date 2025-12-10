import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertRideSchema, insertBookingSchema, signupSchema, loginSchema, type User } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

function stripPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const { email, password, name, role, phone } = result.data;
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser({
        name,
        email,
        password,
        role: role || "passenger",
        phone: phone || null,
        clerkId: null,
        avatar: null,
        cnic: null,
        cnicStatus: "not_uploaded",
        isAdmin: false,
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const { email, password } = result.data;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(stripPassword(user));
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(stripPassword(user));
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Update failed" });
    }
  });

  app.post("/api/users/:id/cnic", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, {
        cnicStatus: "pending",
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(stripPassword(user));
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Upload failed" });
    }
  });

  // Stats route
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const stats = await storage.getDriverStats(req.params.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get stats" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID required" });
    }
    const vehicles = await storage.getVehiclesByOwner(ownerId);
    res.json(vehicles);
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const result = insertVehicleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const vehicle = await storage.createVehicle(result.data);
      res.json(vehicle);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Update failed" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const deleted = await storage.deleteVehicle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ success: true });
  });

  // Ride routes
  app.get("/api/rides", async (req, res) => {
    try {
      const rides = await storage.getAllRides();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get rides" });
    }
  });

  app.get("/api/rides/:id", async (req, res) => {
    const ride = await storage.getRideWithDriver(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    res.json(ride);
  });

  app.post("/api/rides", async (req, res) => {
    try {
      const result = insertRideSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      const ride = await storage.createRide(result.data);
      res.json(ride);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create ride" });
    }
  });

  app.patch("/api/rides/:id", async (req, res) => {
    try {
      const ride = await storage.updateRide(req.params.id, req.body);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Update failed" });
    }
  });

  app.delete("/api/rides/:id", async (req, res) => {
    const deleted = await storage.deleteRide(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Ride not found" });
    }
    res.json({ success: true });
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    const booking = await storage.getBookingWithDetails(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  });

  const createBookingSchema = z.object({
    rideId: z.string(),
    passengerId: z.string(),
    seatsBooked: z.number().min(1).default(1),
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const result = createBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const { rideId, passengerId, seatsBooked } = result.data;
      
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      if (ride.seatsAvailable < seatsBooked) {
        return res.status(400).json({ message: "Not enough seats available" });
      }
      
      const booking = await storage.createBooking({
        rideId,
        passengerId,
        status: "pending",
        seatsBooked,
      });
      
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Update failed" });
    }
  });

  return httpServer;
}
