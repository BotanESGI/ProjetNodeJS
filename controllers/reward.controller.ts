import { Router, Request, Response } from "express";
import Reward from "../services/mongoose/schema/reward.schema";
import { sessionMiddleware, isAdmin } from "../middlewares";
import { SessionService } from "../services/mongoose";
import User from "../services/mongoose/schema/user.schema"; 

export class RewardController {
  constructor(public readonly sessionService: SessionService) {}

  async createReward(req: Request, res: Response) {
  const { title, description, condition, iconUrl, userId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Champs requis : title et description" });
  }

  try {
    const existing = await Reward.findOne({ title });
    if (existing) {
      return res.status(409).json({ message: "Récompense déjà existante." });
    }

    const reward = await Reward.create({ title, description, condition, iconUrl });

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé pour attribution" });
      }

      const alreadyHas = user.rewards.includes(reward._id);
      if (!alreadyHas) {
        user.rewards.push(reward._id);
        await user.save();
      }
    }

    return res.status(201).json({ message: "Récompense créée avec succès", reward });
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
async giveReward(req: Request, res: Response) {
  const { userId, rewardId, challengeId } = req.body;

  if (!userId || !rewardId) {
    return res.status(400).json({ message: "Champs requis : userId et rewardId" });
  }

  try {
    const user = await User.findById(userId);
    const reward = await Reward.findById(rewardId);

    if (!user || !reward) {
      return res.status(404).json({ message: "Utilisateur ou récompense introuvable" });
    }

    const alreadyReceived = user.rewards.some(r => r.toString() === rewardId);
    if (alreadyReceived) {
      return res.status(409).json({ message: "Récompense déjà attribuée" });
    }

    user.rewards.push(rewardId);
    await user.save();

    return res.status(200).json({ message: "Récompense attribuée avec succès", challengeId });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur lors de l’attribution", error: err });
  }
}

  buildRouter(): Router {
    const router = Router();

    router.get("/", sessionMiddleware(this.sessionService), isAdmin, this.getAllRewards.bind(this));
    router.post("/", sessionMiddleware(this.sessionService), isAdmin, this.createReward.bind(this));
    router.post("/admin/give-reward", sessionMiddleware(this.sessionService), isAdmin, this.giveReward.bind(this));


    return router;
  }
}
