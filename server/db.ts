import mongoose from "mongoose";

export async function connectDB() {
  try {
    // Read the URI from .env
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.warn("⚠️ MONGODB_URI is missing in .env file!");
      console.warn("⚠️ Falling back to local DB: mongodb://127.0.0.1:27017/unipool");
    }

    const connectionString = uri || "mongodb://127.0.0.1:27017/unipool";

    // Connect to MongoDB
    await mongoose.connect(connectionString);
    
    // Log success (and hide the password from the console)
    const logUri = connectionString.replace(/:([^:@]+)@/, ":****@"); 
    console.log(`✅ Connected to MongoDB: ${logUri}`);
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// ... (keep your Schemas and Models below) ...
// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  clerkId: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["passenger", "driver", "both"], required: true },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  cnic: { type: String, default: null },
  cnicStatus: { 
    type: String, 
    enum: ["not_uploaded", "pending", "verified", "rejected"], 
    default: "not_uploaded" 
  },
  isAdmin: { type: Boolean, default: false }
});

const vehicleSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ownerId: { type: String, ref: 'User', required: true },
  model: { type: String, required: true },
  plate: { type: String, required: true },
  color: { type: String, required: true },
  seats: { type: Number, default: 4 }
});

const rideSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  driverId: { type: String, ref: 'User', required: true },
  vehicleId: { type: String, ref: 'Vehicle' },
  sourceLat: { type: Number, required: true },
  sourceLng: { type: Number, required: true },
  sourceAddress: { type: String, required: true },
  destLat: { type: Number, required: true },
  destLng: { type: Number, required: true },
  destAddress: { type: String, required: true },
  departureTime: { type: Date, required: true },
  seatsTotal: { type: Number, required: true },
  seatsAvailable: { type: Number, required: true },
  costPerSeat: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ["scheduled", "ongoing", "completed"], default: "scheduled" },
  currentLat: { type: Number },
  currentLng: { type: Number },
});

const bookingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  rideId: { type: String, ref: 'Ride', required: true },
  passengerId: { type: String, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "cancelled"], 
    required: true 
  },
  seatsBooked: { type: Number, default: 1 }
});

const reviewSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  rideId: { type: String, ref: 'Ride', required: true },
  reviewerId: { type: String, ref: 'User', required: true },
  revieweeId: { type: String, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const VehicleModel = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export const RideModel = mongoose.models.Ride || mongoose.model("Ride", rideSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);