/** CLI: populate the local database with demo data. Usage: npm run db:seed */
import { createDb, defaultDbFile } from "./client";
import { todayIso } from "@/lib/dates";
import { createBlock } from "@/server/availability/service";
import { createSeason, savePricing } from "@/server/pricing/service";
import { createRental, listRentals } from "@/server/rentals/service";
import { createReservation } from "@/server/reservations/service";

const db = createDb(defaultDbFile());

if (listRentals(db).length > 0) {
  console.log("Database already has rentals — not seeding twice.");
  process.exit(0);
}

const base = {
  description: "",
  street: "",
  zip: "",
  country: "France",
  bedrooms: 2,
  beds: 3,
  bathrooms: 1,
  checkInFrom: "16:00",
  checkInTo: "22:00",
  checkOutUntil: "10:00",
  minNights: 2,
  maxNights: 365,
} as const;

const chalet = createRental(db, {
  ...base,
  name: "Chalet des Cimes",
  propertyType: "chalet",
  city: "Bourg-Saint-Maurice",
  maxGuests: 6,
  bedrooms: 3,
  beds: 4,
});

const loft = createRental(db, {
  ...base,
  name: "Loft Lumière",
  propertyType: "apartment",
  city: "Lyon",
  maxGuests: 4,
});

const studio = createRental(db, {
  ...base,
  name: "Studio Port-Vieux",
  propertyType: "studio",
  city: "Biarritz",
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  minNights: 1,
});

savePricing(db, chalet.id, {
  baseEuros: 180,
  weekendEuros: 220,
  cleaningFeeEuros: 80,
  cityTaxEuros: 2,
  weeklyDiscountPct: 10,
  monthlyDiscountPct: 25,
});
createSeason(db, {
  rentalId: chalet.id,
  name: "Saison de ski",
  startDate: "2026-12-15",
  endDate: "2027-04-15",
  nightlyEuros: 320,
  weekendEuros: 380,
});
savePricing(db, loft.id, {
  baseEuros: 110,
  weekendEuros: 135,
  cleaningFeeEuros: 45,
  cityTaxEuros: 1.5,
  weeklyDiscountPct: 8,
  monthlyDiscountPct: 20,
});
savePricing(db, studio.id, {
  baseEuros: 75,
  weekendEuros: "",
  cleaningFeeEuros: 30,
  cityTaxEuros: 1,
  weeklyDiscountPct: 0,
  monthlyDiscountPct: 0,
});

// Stays relative to the current month so the calendar has something to show.
const month = todayIso().slice(0, 7);
const d = (day: number) => `${month}-${String(day).padStart(2, "0")}`;

createReservation(db, {
  rentalId: chalet.id,
  checkIn: d(3),
  checkOut: d(10),
  adults: 4,
  children: 2,
  totalEuros: 1450,
  notes: "",
  guest: {
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    language: "fr",
    notes: "",
  },
});

createReservation(db, {
  rentalId: chalet.id,
  checkIn: d(10),
  checkOut: d(15),
  adults: 2,
  children: 0,
  totalEuros: 980,
  notes: "Back-to-back with the Dupont stay.",
  guest: {
    firstName: "James",
    lastName: "Carter",
    email: "j.carter@example.com",
    phone: "",
    language: "en",
    notes: "",
  },
});

createReservation(db, {
  rentalId: loft.id,
  checkIn: d(18),
  checkOut: d(22),
  adults: 2,
  children: 1,
  totalEuros: 520,
  notes: "",
  guest: {
    firstName: "Sofia",
    lastName: "Rossi",
    email: "sofia.rossi@example.com",
    phone: "",
    language: "it",
    notes: "",
  },
});

createBlock(db, {
  rentalId: studio.id,
  startDate: d(24),
  endDate: d(27),
  reason: "Repainting",
});

console.log(
  `Seeded 3 rentals, 3 reservations and 1 block into ${defaultDbFile()}`,
);
