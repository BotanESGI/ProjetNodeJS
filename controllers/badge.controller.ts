import { Router, Request, Response } from "express";
import Badge from "../services/mongoose/schema/badge.schema";
import { sessionMiddleware, isAdmin } from "../middlewares";

export class BadgeController {
  async getAllBadges(req: Request, res: Response) {
    try {
      const badges = await Badge.find();
      res.json(badges);
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la récupération des badges" });
    }
  }

  async createBadge(req: Request, res: Response) {
    try {
      const { name, description, rule, iconUrl } = req.body;

      if (!name || !description || !rule) {
        return res.status(400).json({ message: "Champs requis : name, description, rule" });
      }

      const existing = await Badge.findOne({ $or: [{ name }, { rule }] });
      if (existing) {
        return res.status(409).json({ message: "Un badge avec ce nom ou cette règle existe déjà." });
      }

      const newBadge = await Badge.create({ name, description, rule, iconUrl });
      res.status(201).json(newBadge);
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la création du badge" });
    }
  }

  async updateBadge(req: Request, res: Response) {
    try {
      const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!badge) return res.status(404).json({ message: "Badge non trouvé" });
      res.json(badge);
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  }

  async deleteBadge(req: Request, res: Response) {
    try {
      const deleted = await Badge.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Badge non trouvé" });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    router.use(sessionMiddleware); // sécurise toutes les routes
    router.use(isAdmin);           // limite aux admins

    router.get("/", this.getAllBadges.bind(this));
    router.post("/", this.createBadge.bind(this));
    router.put("/:id", this.updateBadge.bind(this));
    router.delete("/:id", this.deleteBadge.bind(this));
    router.patch("/:id", this.updateBadge.bind(this)); 


    return router;
  }
}
