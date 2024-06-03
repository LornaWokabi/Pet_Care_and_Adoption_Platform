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
    if (
      !req.body.name ||
      typeof req.body.name !== "string" ||
      !req.body.contact ||
      typeof req.body.contact !== "string" ||
      !req.body.userType ||
      typeof req.body.userType !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'name', 'contact', and 'userType' are provided and are strings.",
      });
      return;
    }

    try {
      const user = new User(
        req.body.name,
        req.body.contact,
        req.body.userType
      );
      usersStorage.insert(user.id, user);
      res.status(201).json({
        message: "User created successfully",
        user: user,
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({
        error: "Server error occurred while creating the user.",
      });
    }
  });

  // Endpoint for retrieving all users
  app.get("/users", (req, res) => {
    try {
      const users = usersStorage.values();
      res.status(200).json({
        message: "Users retrieved successfully",
        users: users,
      });
    } catch (error) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving users.",
      });
    }
  });

  // Endpoint for creating a new pet
  app.post("/pets", (req, res) => {
    // Validate the user input
    if (
      !req.body.ownerId ||
      typeof req.body.ownerId !== "string" ||
      !req.body.name ||
      typeof req.body.name !== "string" ||
      !req.body.species ||
      typeof req.body.species !== "string" ||
      !req.body.breed ||
      typeof req.body.breed !== "string" ||
      !req.body.age ||
      typeof req.body.age !== "number" ||
      !req.body.description ||
      typeof req.body.description !== "string" ||
      !req.body.status ||
      typeof req.body.status !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure all fields are provided and are of the correct types.",
      });
      return;
    }

    // Validating the owner ID
    const owner = usersStorage.get(req.body.ownerId);
    if (owner === None) {
      res.status(400).json({
        error: "Invalid input: Ensure the 'ownerId' is a valid owner ID.",
      });
      return;
    }
    
    try {
      const pet = new Pet(
        req.body.ownerId,
        req.body.name,
        req.body.species,
        req.body.breed,
        req.body.age,
        req.body.description,
        req.body.status
      );
      petsStorage.insert(pet.id, pet);
      res.status(201).json({
        message: "Pet created successfully",
        pet: pet,
      });
    } catch (error) {
      console.error("Failed to create pet:", error);
      res.status(500).json({
        error: "Server error occurred while creating the pet.",
      });
    }
  });

  // Endpoint for retrieving all pets
  app.get("/pets", (req, res) => {
    try {
      const pets = petsStorage.values();
      res.status(200).json({
        message: "Pets retrieved successfully",
        pets: pets,
      });
    } catch (error) {
      console.error("Failed to retrieve pets:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving pets.",
      });
    }
  });

  // Endpoint for creating a new adoption request
  app.post("/adoption-requests", (req, res) => {
    if (
      !req.body.petId ||
      typeof req.body.petId !== "string" ||
      !req.body.adopterId ||
      typeof req.body.adopterId !== "string" ||
      !req.body.status ||
      typeof req.body.status !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'petId', 'adopterId', and 'status' are provided and are strings.",
      });
      return;
    }

    // Validating the pet ID
    const pet = petsStorage.get(req.body.petId);
    if (pet === None) {
      res.status(400).json({
        error: "Invalid input: Ensure the 'petId' is a valid pet ID.",
      });
      return;
    }

    try {
      const adoptionRequest = new AdoptionRequest(
        req.body.petId,
        req.body.adopterId,
        req.body.status
      );
      adoptionRequestsStorage.insert(adoptionRequest.id, adoptionRequest);
      res.status(201).json({
        message: "Adoption request created successfully",
        adoptionRequest: adoptionRequest,
      });
    } catch (error) {
      console.error("Failed to create adoption request:", error);
      res.status(500).json({
        error: "Server error occurred while creating the adoption request.",
      });
    }
  });

  // Endpoint for retrieving all adoption requests
  app.get("/adoption-requests", (req, res) => {
    try {
      const adoptionRequests = adoptionRequestsStorage.values();
      res.status(200).json({
        message: "Adoption requests retrieved successfully",
        adoptionRequests: adoptionRequests,
      });
    } catch (error) {
      console.error("Failed to retrieve adoption requests:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving adoption requests.",
      });
    }
  });

  // Endpoint for creating a new pet care event
  app.post("/pet-care-events", (req, res) => {
    if (
      !req.body.title ||
      typeof req.body.title !== "string" ||
      !req.body.description ||
      typeof req.body.description !== "string" ||
      !req.body.dateTime ||
      !req.body.location ||
      typeof req.body.location !== "string" ||
      !req.body.organizerId ||
      typeof req.body.organizerId !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure all fields are provided and are of the correct types.",
      });
      return;
    }

    try {
      const petCareEvent = new PetCareEvent(
        req.body.title,
        req.body.description,
        new Date(req.body.dateTime),
        req.body.location,
        req.body.organizerId
      );
      petCareEventsStorage.insert(petCareEvent.id, petCareEvent);
      res.status(201).json({
        message: "Pet care event created successfully",
        petCareEvent: petCareEvent,
      });
    } catch (error) {
      console.error("Failed to create pet care event:", error);
      res.status(500).json({
        error: "Server error occurred while creating the pet care event.",
      });
    }
  });

  // Endpoint for retrieving all pet care events
  app.get("/pet-care-events", (req, res) => {
    try {
      const petCareEvents = petCareEventsStorage.values();
      res.status(200).json({
        message: "Pet care events retrieved successfully",
        petCareEvents: petCareEvents,
      });
    } catch (error) {
      console.error("Failed to retrieve pet care events:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving pet care events.",
      });
    }
  });

  // Endpoint for creating new feedback
  app.post("/feedbacks", (req, res) => {
    if (
      !req.body.userId ||
      typeof req.body.userId !== "string" ||
      !req.body.feedback ||
      typeof req.body.feedback !== "string" ||
      !req.body.rating ||
      typeof req.body.rating !== "number" ||
      (req.body.petId && typeof req.body.petId !== "string") ||
      (req.body.eventId && typeof req.body.eventId !== "string")
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'userId', 'feedback', 'rating', and optionally 'petId' and 'eventId' are provided and are of the correct types.",
      });
      return;
    }

    // Validating the user ID
    const user = usersStorage.get(req.body.userId);
    if (user === None) {
      res.status(400).json({
        error: "Invalid input: Ensure the 'userId' is a valid user ID.",
      });
      return;
    }

    // Validating the pet ID
    if (req.body.petId) {
      const pet = petsStorage.get(req.body.petId);
      if (pet === None) {
        res.status(400).json({
          error: "Invalid input: Ensure the 'petId' is a valid pet ID.",
        });
        return;
      }
    }

    // Validating the event ID
    if (req.body.eventId) {
      const petCareEvent = petCareEventsStorage.get(req.body.eventId);
      if (petCareEvent === None) {
        res.status(400).json({
          error: "Invalid input: Ensure the 'eventId' is a valid pet care event ID.",
        });
        return;
      }
    }

    try {
      const feedback = new Feedback(
        req.body.userId,
        req.body.petId || null,
        req.body.eventId || null,
        req.body.feedback,
        req.body.rating
      );
      feedbacksStorage.insert(feedback.id, feedback);
      res.status(201).json({
        message: "Feedback created successfully",
        feedback: feedback,
      });
    } catch (error) {
      console.error("Failed to create feedback:", error);
      res.status(500).json({
        error: "Server error occurred while creating the feedback.",
      });
    }
  });

  // Endpoint for retrieving all feedback
  app.get("/feedbacks", (req, res) => {
    try {
      const feedbacks = feedbacksStorage.values();
      res.status(200).json({
        message: "Feedback retrieved successfully",
        feedbacks: feedbacks,
      });
    } catch (error) {
      console.error("Failed to retrieve feedback:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving feedback.",
      });
    }
  });

  // Endpoint for creating a new donation
  app.post("/donations", (req, res) => {
    if (
      !req.body.donorId ||
      typeof req.body.donorId !== "string" ||
      !req.body.amount ||
      typeof req.body.amount !== "number"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'donorId' is provided as a string and 'amount' is provided as a number.",
      });
      return;
    }

    try {
      const donation = new Donation(req.body.donorId, req.body.amount);
      donationsStorage.insert(donation.id, donation);
      res.status(201).json({
        message: "Donation created successfully",
        donation: donation,
      });
    } catch (error) {
      console.error("Failed to create donation:", error);
      res.status(500).json({
        error: "Server error occurred while creating the donation.",
      });
    }
  });

  // Endpoint for retrieving all donations
  app.get("/donations", (req, res) => {
    try {
      const donations = donationsStorage.values();
      res.status(200).json({
        message: "Donations retrieved successfully",
        donations: donations,
      });
    } catch (error) {
      console.error("Failed to retrieve donations:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving donations.",
      });
    }
  });

  // Start the server
  return app.listen();
});
