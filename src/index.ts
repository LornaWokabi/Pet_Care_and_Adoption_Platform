import { v4 as uuidv4 } from "uuid";
import { Server, StableBTreeMap, Principal, None } from "azle";
import express from "express";

// Define the User class to represent users (owners, shelters, adopters)
class User {
  id: string;
  name: string;
  contact: string;
  userType: string; // 'Owner', 'Shelter', 'Adopter'
  createdAt: Date;

  constructor(name: string, contact: string, userType: string) {
    this.id = uuidv4();
    this.name = name;
    this.contact = contact;
    this.userType = userType;
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

// Define the express server
export default Server(() => {
  const app = express();
  app.use(express.json());

  // Endpoint for creating a new user
  app.post("/users", (req, res) => {
    const { name, contact, userType } = req.body;
    if (!name || !contact || !userType || typeof name !== "string" || typeof contact !== "string" || typeof userType !== "string") {
      res.status(400).json({ error: "Invalid input: Ensure 'name', 'contact', and 'userType' are provided and are strings." });
      return;
    }

    try {
      const user = new User(name, contact, userType);
      usersStorage.insert(user.id, user);
      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Server error occurred while creating the user." });
    }
  });

  // Endpoint for retrieving all users
  app.get("/users", (req, res) => {
    try {
      const users = usersStorage.values();
      res.status(200).json({ message: "Users retrieved successfully", users });
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ error: "Server error occurred while retrieving users." });
    }
  });

  // Endpoint for creating a new pet
  app.post("/pets", (req, res) => {
    const { ownerId, name, species, breed, age, description, status } = req.body;
    if (!ownerId || !name || !species || !breed || !age || !description || !status || 
        typeof ownerId !== "string" || typeof name !== "string" || typeof species !== "string" ||
        typeof breed !== "string" || typeof age !== "number" || typeof description !== "string" || 
        typeof status !== "string") {
      res.status(400).json({ error: "Invalid input: Ensure all fields are provided and are of the correct types." });
      return;
    }

    const owner = usersStorage.get(ownerId);
    if (owner === None) {
      res.status(400).json({ error: "Invalid input: Ensure the 'ownerId' is a valid owner ID." });
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

  // Endpoint for retrieving all pets
  app.get("/pets", (req, res) => {
    try {
      const pets = petsStorage.values();
      res.status(200).json({ message: "Pets retrieved successfully", pets });
    } catch (error) {
      console.error("Failed to retrieve pets:", error);
      res.status(500).json({ error: "Server error occurred while retrieving pets." });
    }
  });

  // Endpoint for creating a new adoption request
  app.post("/adoption-requests", (req, res) => {
    const { petId, adopterId, status } = req.body;
    if (!petId || !adopterId || !status || typeof petId !== "string" || typeof adopterId !== "string" || typeof status !== "string") {
      res.status(400).json({ error: "Invalid input: Ensure 'petId', 'adopterId', and 'status' are provided and are strings." });
      return;
    }

    const pet = petsStorage.get(petId);
    if (pet === None) {
      res.status(400).json({ error: "Invalid input: Ensure the 'petId' is a valid pet ID." });
      return;
    }

    try {
      const adoptionRequest = new AdoptionRequest(petId, adopterId, status);
      adoptionRequestsStorage.insert(adoptionRequest.id, adoptionRequest);
      res.status(201).json({ message: "Adoption request created successfully", adoptionRequest });
    } catch (error) {
      console.error("Failed to create adoption request:", error);
      res.status(500).json({ error: "Server error occurred while creating the adoption request." });
    }
  });

  // Endpoint for retrieving all adoption requests
  app.get("/adoption-requests", (req, res) => {
    try {
      const adoptionRequests = adoptionRequestsStorage.values();
      res.status(200).json({ message: "Adoption requests retrieved successfully", adoptionRequests });
    } catch (error) {
      console.error("Failed to retrieve adoption requests:", error);
      res.status(500).json({ error: "Server error occurred while retrieving adoption requests." });
    }
  });

  // Endpoint for creating a new pet care event
  app.post("/pet-care-events", (req, res) => {
    const { title, description, dateTime, location, organizerId } = req.body;
    if (!title || !description || !dateTime || !location || !organizerId ||
        typeof title !== "string" || typeof description !== "string" || 
        typeof location !== "string" || typeof organizerId !== "string") {
      res.status(400).json({ error: "Invalid input: Ensure all fields are provided and are of the correct types." });
      return;
    }

    try {
      const petCareEvent = new PetCareEvent(title, description, new Date(dateTime), location, organizerId);
      petCareEventsStorage.insert(petCareEvent.id, petCareEvent);
      res.status(201).json({ message: "Pet care event created successfully", petCareEvent });
    } catch (error) {
      console.error("Failed to create pet care event:", error);
      res.status(500).json({ error: "Server error occurred while creating the pet care event." });
    }
  });

  // Endpoint for retrieving all pet care events
  app.get("/pet-care-events", (req, res) => {
    try {
      const petCareEvents = petCareEventsStorage.values();
      res.status(200).json({ message: "Pet care events retrieved successfully", petCareEvents });
    } catch (error) {
      console.error("Failed to retrieve pet care events:", error);
      res.status(500).json({ error: "Server error occurred while retrieving pet care events." });
    }
  });

  // Endpoint for creating new feedback
  app.post("/feedbacks", (req, res) => {
    const { userId, feedback, rating, petId, eventId } = req.body;
    if (!userId || !feedback || !rating || typeof userId !== "string" || typeof feedback !== "string" || 
        typeof rating !== "number" || (petId && typeof petId !== "string") || (eventId && typeof eventId !== "string")) {
      res.status(400).json({ error: "Invalid input: Ensure 'userId', 'feedback', 'rating', and optionally 'petId' and 'eventId' are provided and are of the correct types." });
      return;
    }

    const user = usersStorage.get(userId);
    if (user === None) {
      res.status(400).json({ error: "Invalid input: Ensure the 'userId' is a valid user ID." });
      return;
    }

    if (petId) {
      const pet = petsStorage.get(petId);
      if (pet === None) {
        res.status(400).json({ error: "Invalid input: Ensure the 'petId' is a valid pet ID." });
        return;
      }
    }

    if (eventId) {
      const petCareEvent = petCareEventsStorage.get(eventId);
      if (petCareEvent === None) {
        res.status(400).json({ error: "Invalid input: Ensure the 'eventId' is a valid pet care event ID." });
        return;
      }
    }

    try {
      const feedbackEntry = new Feedback(userId, petId || null, eventId || null, feedback, rating);
      feedbacksStorage.insert(feedbackEntry.id, feedbackEntry);
      res.status(201).json({ message: "Feedback created successfully", feedback: feedbackEntry });
    } catch (error) {
      console.error("Failed to create feedback:", error);
      res.status(500).json({ error: "Server error occurred while creating the feedback." });
    }
  });

  // Endpoint for retrieving all feedback
  app.get("/feedbacks", (req, res) => {
    try {
      const feedbacks = feedbacksStorage.values();
      res.status(200).json({ message: "Feedback retrieved successfully", feedbacks });
    } catch (error) {
      console.error("Failed to retrieve feedback:", error);
      res.status(500).json({ error: "Server error occurred while retrieving feedback." });
    }
  });

  // Endpoint for creating a new donation
  app.post("/donations", (req, res) => {
    const { donorId, amount } = req.body;
    if (!donorId || !amount || typeof donorId !== "string" || typeof amount !== "number") {
      res.status(400).json({ error: "Invalid input: Ensure 'donorId' is provided as a string and 'amount' is provided as a number." });
      return;
    }

    try {
      const donation = new Donation(donorId, amount);
      donationsStorage.insert(donation.id, donation);
      res.status(201).json({ message: "Donation created successfully", donation });
    } catch (error) {
      console.error("Failed to create donation:", error);
      res.status(500).json({ error: "Server error occurred while creating the donation." });
    }
  });

  // Endpoint for retrieving all donations
  app.get("/donations", (req, res) => {
    try {
      const donations = donationsStorage.values();
      res.status(200).json({ message: "Donations retrieved successfully", donations });
    } catch (error) {
      console.error("Failed to retrieve donations:", error);
      res.status(500).json({ error: "Server error occurred while retrieving donations." });
    }
  });

  // Additional CRUD endpoints

  // Update user
  app.put("/users/:id", (req, res) => {
    const { name, contact, userType } = req.body;
    const user = usersStorage.get(req.params.id);
    if (user === None) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (name && typeof name === "string") user.name = name;
    if (contact && typeof contact === "string") user.contact = contact;
    if (userType && typeof userType === "string") user.userType = userType;
    usersStorage.insert(req.params.id, user);
    res.status(200).json({ message: "User updated successfully", user });
  });

  // Delete user
  app.delete("/users/:id", (req, res) => {
    const user = usersStorage.get(req.params.id);
    if (user === None) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    usersStorage.remove(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  });

  // Update pet
  app.put("/pets/:id", (req, res) => {
    const { name, species, breed, age, description, status } = req.body;
    const pet = petsStorage.get(req.params.id);
    if (pet === None) {
      res.status(404).json({ error: "Pet not found." });
      return;
    }
    if (name && typeof name === "string") pet.name = name;
    if (species && typeof species === "string") pet.species = species;
    if (breed && typeof breed === "string") pet.breed = breed;
    if (age && typeof age === "number") pet.age = age;
    if (description && typeof description === "string") pet.description = description;
    if (status && typeof status === "string") pet.status = status;
    petsStorage.insert(req.params.id, pet);
    res.status(200).json({ message: "Pet updated successfully", pet });
  });

  // Delete pet
  app.delete("/pets/:id", (req, res) => {
    const pet = petsStorage.get(req.params.id);
    if (pet === None) {
      res.status(404).json({ error: "Pet not found." });
      return;
    }
    petsStorage.remove(req.params.id);
    res.status(200).json({ message: "Pet deleted successfully" });
  });

  // Update adoption request
  app.put("/adoption-requests/:id", (req, res) => {
    const { status } = req.body;
    const adoptionRequest = adoptionRequestsStorage.get(req.params.id);
    if (adoptionRequest === None) {
      res.status(404).json({ error: "Adoption request not found." });
      return;
    }
    if (status && typeof status === "string") adoptionRequest.status = status;
    adoptionRequestsStorage.insert(req.params.id, adoptionRequest);
    res.status(200).json({ message: "Adoption request updated successfully", adoptionRequest });
  });

  // Delete adoption request
  app.delete("/adoption-requests/:id", (req, res) => {
    const adoptionRequest = adoptionRequestsStorage.get(req.params.id);
    if (adoptionRequest === None) {
      res.status(404).json({ error: "Adoption request not found." });
      return;
    }
    adoptionRequestsStorage.remove(req.params.id);
    res.status(200).json({ message: "Adoption request deleted successfully" });
  });

  // Update pet care event
  app.put("/pet-care-events/:id", (req, res) => {
    const { title, description, dateTime, location } = req.body;
    const petCareEvent = petCareEventsStorage.get(req.params.id);
    if (petCareEvent === None) {
      res.status(404).json({ error: "Pet care event not found." });
      return;
    }
    if (title && typeof title === "string") petCareEvent.title = title;
    if (description && typeof description === "string") petCareEvent.description = description;
    if (dateTime) petCareEvent.dateTime = new Date(dateTime);
    if (location && typeof location === "string") petCareEvent.location = location;
    petCareEventsStorage.insert(req.params.id, petCareEvent);
    res.status(200).json({ message: "Pet care event updated successfully", petCareEvent });
  });

  // Delete pet care event
  app.delete("/pet-care-events/:id", (req, res) => {
    const petCareEvent = petCareEventsStorage.get(req.params.id);
    if (petCareEvent === None) {
      res.status(404).json({ error: "Pet care event not found." });
      return;
    }
    petCareEventsStorage.remove(req.params.id);
    res.status(200).json({ message: "Pet care event deleted successfully" });
  });

  // Update feedback
  app.put("/feedbacks/:id", (req, res) => {
    const { feedback, rating } = req.body;
    const feedbackEntry = feedbacksStorage.get(req.params.id);
    if (feedbackEntry === None) {
      res.status(404).json({ error: "Feedback not found." });
      return;
    }
    if (feedback && typeof feedback === "string") feedbackEntry.feedback = feedback;
    if (rating && typeof rating === "number") feedbackEntry.rating = rating;
    feedbacksStorage.insert(req.params.id, feedbackEntry);
    res.status(200).json({ message: "Feedback updated successfully", feedback: feedbackEntry });
  });

  // Delete feedback
  app.delete("/feedbacks/:id", (req, res) => {
    const feedbackEntry = feedbacksStorage.get(req.params.id);
    if (feedbackEntry === None) {
      res.status(404).json({ error: "Feedback not found." });
      return;
    }
    feedbacksStorage.remove(req.params.id);
    res.status(200).json({ message: "Feedback deleted successfully" });
  });

  // Update donation
  app.put("/donations/:id", (req, res) => {
    const { amount } = req.body;
    const donation = donationsStorage.get(req.params.id);
    if (donation === None) {
      res.status(404).json({ error: "Donation not found." });
      return;
    }
    if (amount && typeof amount === "number") donation.amount = amount;
    donationsStorage.insert(req.params.id, donation);
    res.status(200).json({ message: "Donation updated successfully", donation });
  });

  // Delete donation
  app.delete("/donations/:id", (req, res) => {
    const donation = donationsStorage.get(req.params.id);
    if (donation === None) {
      res.status(404).json({ error: "Donation not found." });
      return;
    }
    donationsStorage.remove(req.params.id);
    res.status(200).json({ message: "Donation deleted successfully" });
  });

  // Start the server
  return app.listen();
});