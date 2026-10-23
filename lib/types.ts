export type Role = "traveler" | "driver";
export type VehicleType = "toto" | "cab";
export type BookingType = "live" | "scheduled";
export type RideStatus = "pending" | "accepted" | "ongoing" | "completed" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: Role;
  created_at: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  model: string | null;
  is_active: boolean;
}

export interface Ride {
  id: string;
  traveler_id: string;
  driver_id: string | null;
  pickup_location: string;
  drop_location: string;
  booking_type: BookingType;
  scheduled_for: string | null;
  vehicle_type: VehicleType;
  distance_km: number;
  fare: number;
  demand_multiplier: number;
  status: RideStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MarketStats {
  onlineDrivers: number;
  pendingRides: number;
}
