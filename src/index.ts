import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { generateNonce, SiweMessage, SiweErrorType } from "siwe";
import Session from "express-session";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import session from "express-session";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(
  Session({
    name: "gnosis",
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true },
  }),
);

const port = process.env.PORT;

app.get("/", (_req, res) => {
  res.send("Basic Setup");
});

app.get("/nonce", (req, res) => {
  req.session.nonce = generateNonce();
  res.setHeader("Content-Type", "text/plain");
  res.send(req.session.nonce);
});

app.post("/verify", async (req, res) => {
  try {
    if (!req.body.message) {
      res
        .status(422)
        .json({ message: "Expected prepareMessage object as body." });
      return;
    } else if (!req.session.nonce) {
      res.status(422).json({ message: "Expected to have nonce set up" });
      return;
    }

    let SIWEObject = new SiweMessage(req.body.message);
    const { data: message } = await SIWEObject.verify({
      signature: req.body.signature,
      nonce: req.session.nonce,
    });

    req.session.siwe = message;
    if (message.expirationTime) {
      req.session.cookie.expires = new Date(message.expirationTime!);
    }
    req.session.save(() => res.status(200).send(true));

    await prisma.user.upsert({
      where: { eth: message.address },
      update: {},
      create: { username: crypto.randomUUID(), eth: message.address },
    });
  } catch (e: any) {
    req.session.siwe = null;
    req.session.nonce = null;
    console.error(e);
    switch (e) {
      case SiweErrorType.EXPIRED_MESSAGE: {
        req.session.save(() => res.status(440).json({ message: e.message }));
        break;
      }
      case SiweErrorType.INVALID_SIGNATURE: {
        req.session.save(() => res.status(422).json({ message: e.message }));
        break;
      }
      default: {
        req.session.save(() => res.status(500).json({ message: e.message }));
        break;
      }
    }
  }
});

app.get("/current-user", async (req, res) => {
  if (!req.session.siwe) {
    res.status(401).json({ message: "You have to first sign_in" });
    return;
  }
  const user = await prisma.user.findFirst({
    where: { eth: req.session.siwe.address },
  });
  res.setHeader("Content-Type", "application/json");
  res.send(user);
});

app.patch("/current-user", async (req, res) => {
  const { username, bio } = req.body;
  const user = await prisma.user.update({
    where: { eth: req.session.siwe.address },
    data: { username, bio },
  });

  res.json(user);
});

app.post("/logout", (req, res) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.log("failed to destroy session", err);
    } else {
      console.log("session was successfully destroyed");
    }
  });

  res.setHeader("Content-Type", "application/json");
  res.send(true);
});

app.get("/posts", async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { eth: req.session.siwe.address },
  });
  if (!user) {
    res.status(403).send("Authentication is required");
    return;
  }

  const posts = await prisma.post.findMany();

  res.setHeader("Content-Type", "application/json").send(posts);
});

app.post("/posts", async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { eth: req.session.siwe.address },
  });
  if (!user) {
    res.status(403).send("Authentication is required");
    return;
  }
  const { text } = req.body;

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      text,
    },
  });

  res.setHeader("Content-Type", "application/json").status(201);
  res.send(post);
});

app.listen(port, () => {
  console.log("Server is running!");
});
