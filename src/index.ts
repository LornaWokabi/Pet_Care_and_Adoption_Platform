import { v4 as uuidv4 } from "uuid";
import { Server, StableBTreeMap, Principal, None } from "azle";
import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "your_secret_key"; // Replace with your secret key

// Define the User class to represent users (owners, shelters, adopters)
class User {
  id: string;
  name: string;
  contact: string;
  userType: string; // 'Owner', 'Shelter', 'Adopter'
  password: string; // Store hashed passwords
  createdAt: Date;

  constructor(name: string, contact: string, userType: string, password: string) {
    this.id = uuidv4();
    this.name = name;
    this.contact = contact;
    this.userType = userType;
    this.password = bcrypt.hashSync(password, 10); // Hash the password
    this.createdAt = new Date();
  }
}

// Define the Pet class to represent pets
class Pet {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  description: string;
  status: string; // 'Available', 'Adopted'
  createdAt: Date;

  constructor(ownerId: string, name: string, species: string, breed: string, age: number, description: string, status: string) {
    this.id = uuidv4();
    this.ownerId = ownerId;
    this.name = name;
    this.species = species;
    this.breed = breed;
    this.age = age;
    this.description = description;
    this.status = status;
    this.createdAt = new Date();
  }
}

// Define the AdoptionRequest class to represent adoption requests
class AdoptionRequest {
  id: string;
  petId: string;
  adopterId: string;
  status: string; // 'Pending', 'Approved', 'Rejected'
  requestedAt: Date;
  approvedAt: Date | null;

  constructor(petId: string, adopterId: string, status: string) {
    this.id = uuidv4();
    this.petId = petId;
    this.adopterId = adopterId;
    this.status = status;
    this.requestedAt = new Date();
    this.approvedAt = null;
  }
}

// Define the PetCareEvent class to represent pet care events
class PetCareEvent {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  organizerId: string;
  createdAt: Date;

  constructor(title: string, description: string, dateTime: Date, location: string, organizerId: string) {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.dateTime = dateTime;
    this.location = location;
    this.organizerId = organizerId;
    this.createdAt = new Date();
  }
}

// Define the Feedback class to represent feedback
class Feedback {
  id: string;
  userId: string;
  petId: string | null;
  eventId: string | null;
  feedback: string;
  rating: number; // e.g., 1-5 stars
  createdAt: Date;

  constructor(userId: string, petId: string | null, eventId: string | null, feedback: string, rating: number) {
    this.id = uuidv4();
    this.userId = userId;
    this.petId = petId;
    this.eventId = eventId;
    this.feedback = feedback;
    this.rating = rating;
    this.createdAt = new Date();
  }
}

// Define the Donation class to represent donations
class Donation {
  id: string;
  donorId: string;
  amount: number;
  createdAt: Date;

  constructor(donorId: string, amount: number) {
    this.id = uuidv4();
    this.donorId = donorId;
    this.amount = amount;
    this.createdAt = new Date();
  }
}

// Initialize stable maps for storing platform data
const usersStorage = StableBTreeMap<string, User>(0);
const petsStorage = StableBTreeMap<string, Pet>(1);
const adoptionRequestsStorage = StableBTreeMap<string, AdoptionRequest>(2);
const petCareEventsStorage = StableBTreeMap<string, PetCareEvent>(3);
const feedbacksStorage = StableBTreeMap<string, Feedback>(4);
const donationsStorage = StableBTreeMap<string, Donation>(5);

// Express middleware for authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Define the express server
export default Server(() => {
  const app = express();
  app.use(express.json());

  // Endpoint for user registration
  app.post("/register", (req, res) => {
    const { name, contact, userType, password } = req.body;
    if (!name || !contact || !userType || !password) {
      res.status(400).json({
        error: "Invalid input: Ensure 'name', 'contact', 'userType', and 'password' are provided.",
      });
      return;
    }

    try {
      const user = new User(name, contact, userType, password);
      usersStorage.insert(user.id, user);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Failed to register user:", error);
      res.status(500).json({ error: "Server error occurred while registering the user." });
    }
  });

  // Endpoint for user login
  app.post("/login", (req, res) => {
    const { contact, password } = req.body;
    if (!contact || !password) {
      res.status(400).json({ error: "Invalid input: Ensure 'contact' and 'password' are provided." });
      return;
    }

    const user = Array.from(usersStorage.values()).find(user => user.contact === contact);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(400).json({ error: "Invalid contact or password" });
      return;
    }

    const token = jwt.sign({ id: user.id, userType: user.userType }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });

  // Secure endpoint example
  app.get("/secure-data", authenticateToken, (req, res) => {
    res.json({ message: "This is secured data." });
  });

  // Endpoint for creating a new user (Admin only)
  app.post("/users", authenticateToken, (req, res) => {
    const { name, contact, userType, password } = req.body;
    if (req.user.userType !== 'Admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!name || !contact || !userType || !password) {
      res.status(400).json({ error: "Invalid input: Ensure 'name', 'contact', 'userType', and 'password' are provided." });
      return;
    }

    try {
      const user = new User(name, contact, userType, password);
      usersStorage.insert(user.id, user);
      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Server error occurred while creating the user." });
    }
  });

  // Endpoint for retrieving all users with pagination
  app.get("/users", authenticateToken, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
      const users = Array.from(usersStorage.values()).slice(startIndex, endIndex);
      res.status(200).json({
        message: "Users retrieved successfully",
        users,
        page,
        limit,
        total: usersStorage.size,
      });
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ error: "Server error occurred while retrieving users." });
    }
  });

  // Endpoint for creating a new pet
  app.post("/pets", authenticateToken, (req, res) => {
    const { ownerId, name, species, breed, age, description, status } = req.body;

    if (
      !ownerId ||
      typeof ownerId !== "string" ||
      !name ||
      typeof name !== "string" ||
      !species ||
      typeof species !== "string" ||
      !breed ||
      typeof breed !== "string" ||
      !age ||
      typeof age !== "number" ||
      !description ||
      typeof description !== "string" ||
      !status ||
      typeof status !== "string"
    ) {
      res.status(400).json({
        error: "Invalid input: Ensure 'ownerId', 'name', 'species', 'breed', 'age', 'description', and 'status' are provided.",
      });
      return;
    }

    try {
      const pet = new Pet(ownerId, name, species, breed, age, description, status);
      petsStorage.insert(pet.id, pet);
      res.status(201).json({ message: "Pet created successfully", pet });
    } catch (error) {
      console.error("Failed to create pet:", error);
      res.status(500).json({ error: "Server error occurred while creating the pet." });
    }
  });

  // Endpoint for retrieving all pets with pagination and filtering
  app.get("/pets", authenticateToken, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const species = req.query.species as string | undefined;
    const status = req.query.status as string | undefined;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
      let pets = Array.from(petsStorage.values());

      if (species) {
        pets = pets.filter(pet => pet.species === species);
      }

      if (status) {
        pets = pets.filter(pet => pet.status === status);
      }

      const paginatedPets = pets.slice(startIndex, endIndex);
      res.status(200).json({
        message: "Pets retrieved successfully",
        pets: paginatedPets,
        page,
        limit,
        total: pets.length,
      });
    } catch (error) {
      console.error("Failed to retrieve pets:", error);
      res.status(500).json({ error: "Server error occurred while retrieving pets." });
    }
  });

  // Endpoint for creating an adoption request
  app.post("/adoption-requests", authenticateToken, (req, res) => {
    const { petId } = req.body;
    const adopterId = req.user.id;

    if (!petId || typeof petId !== "string") {
      res.status(400).json({ error: "Invalid input: Ensure 'petId' is provided." });
      return;
    }

    try {
      const adoptionRequest = new AdoptionRequest(petId, adopterId, "Pending");
      adoptionRequestsStorage.insert(adoptionRequest.id, adoptionRequest);
      res.status(201).json({ message: "Adoption request created successfully", adoptionRequest });
    } catch (error) {
      console.error("Failed to create adoption request:", error);
      res.status(500).json({ error: "Server error occurred while creating the adoption request." });
    }
  });

  // Endpoint for creating a pet care event
  app.post("/pet-care-events", authenticateToken, (req, res) => {
    const { title, description, dateTime, location } = req.body;
    const organizerId = req.user.id;

    if (
      !title ||
      typeof title !== "string" ||
      !description ||
      typeof description !== "string" ||
      !dateTime ||
      !location ||
      typeof location !== "string"
    ) {
      res.status(400).json({
        error: "Invalid input: Ensure 'title', 'description', 'dateTime', and 'location' are provided.",
      });
      return;
    }

    try {
      const eventDate = new Date(dateTime);
      const petCareEvent = new PetCareEvent(title, description, eventDate, location, organizerId);
      petCareEventsStorage.insert(petCareEvent.id, petCareEvent);
      res.status(201).json({ message: "Pet care event created successfully", petCareEvent });
    } catch (error) {
      console.error("Failed to create pet care event:", error);
      res.status(500).json({ error: "Server error occurred while creating the pet care event." });
    }
  });

  // Endpoint for creating feedback
  app.post("/feedbacks", authenticateToken, (req, res) => {
    const { petId, eventId, feedback, rating } = req.body;
    const userId = req.user.id;

    if (
      !feedback ||
      typeof feedback !== "string" ||
      !rating ||
      typeof rating !== "number" ||
      (petId && typeof petId !== "string") ||
      (eventId && typeof eventId !== "string")
    ) {
      res.status(400).json({
        error: "Invalid input: Ensure 'feedback', 'rating', and optionally 'petId' or 'eventId' are provided.",
      });
      return;
    }

    try {
      const feedbackEntry = new Feedback(userId, petId || null, eventId || null, feedback, rating);
      feedbacksStorage.insert(feedbackEntry.id, feedbackEntry);
      res.status(201).json({ message: "Feedback submitted successfully", feedbackEntry });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      res.status(500).json({ error: "Server error occurred while submitting feedback." });
    }
  });

  // Endpoint for creating a donation
  app.post("/donations", authenticateToken, (req, res) => {
    const { amount } = req.body;
    const donorId = req.user.id;

    if (!amount || typeof amount !== "number") {
      res.status(400).json({ error: "Invalid input: Ensure 'amount' is provided." });
      return;
    }

    try {
      const donation = new Donation(donorId, amount);
      donationsStorage.insert(donation.id, donation);
      res.status(201).json({ message: "Donation made successfully", donation });
    } catch (error) {
      console.error("Failed to make donation:", error);
      res.status(500).json({ error: "Server error occurred while making the donation." });
    }
  });

  // Additional error handling for unknown routes
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
});
