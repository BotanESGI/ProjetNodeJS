import { Router, Request, Response } from "express";
import Reward from "../services/mongoose/schema/reward.schema";
import { sessionMiddleware, isAdmin } from "../middlewares";
import { SessionService } from "../services/mongoose";

export class RewardController {
  constructor(public readonly sessionService: SessionService) {}

  async createReward(req: Request, res: Response) {
    const { title, description, condition, iconUrl } = req.body;

    if (!title || !description || !condition) {
      return res.status(400).json({ message: "Champs requis : title, description, condition" });
    }

    try {
      const existing = await Reward.findOne({ title });
      if (existing) {
        return res.status(409).json({ message: "Récompense déjà existante." });
      }

      const reward = await Reward.create({ title, description, condition, iconUrl });
      return res.status(201).json(reward);
    } catch (err) {
      return res.status(500).json({ message: "Erreur serveur lors de la création de la récompense." });
    }
  }

  async getAllRewards(req: Request, res: Response) {
    try {
      const rewards = await Reward.find();
      res.status(200).json(rewards);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur lors de la récupération des récompenses." });
    }
  }

  buildRouter(): Router {
    const router = Router();

    router.get("/", sessionMiddleware(this.sessionService), isAdmin, this.getAllRewards.bind(this));
    router.post("/", sessionMiddleware(this.sessionService), isAdmin, this.createReward.bind(this));

    return router;
  }
}
