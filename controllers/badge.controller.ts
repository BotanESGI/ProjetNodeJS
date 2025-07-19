import { Router, Request, Response } from "express";
import Badge from "../services/mongoose/schema/badge.schema"; // 🔁 remet cette ligne tout en haut si elle était commentée
//import { sessionMiddleware, isAdmin } from "../middlewares"; // ✅ Ajouté ici

export class BadgeController {
async getAllBadges(req: Request, res: Response) {
  try {
    const badges = await Badge.find();
    console.log("Badges trouvés :", badges); // 👀 Debug console
    res.json(badges);
  } catch (err) {
    console.error("Erreur dans getAllBadges :", err); // 👀 log d’erreur complet
    res.status(500).json({ message: "Erreur lors de la récupération des badges", error: err });
  }
}
async getBadgeById(req: Request, res: Response) {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: "Badge non trouvé" });
    }
    res.status(200).json(badge);
  } catch (err) {
    console.error("Erreur dans getBadgeById :", err);
    res.status(500).json({ message: "Erreur lors de la récupération du badge", error: err });
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
    console.error("Erreur dans createBadge :", err);
    res.status(500).json({ message: "Erreur lors de la création du badge", error: err });
  }
}

  async updateBadge(req: Request, res: Response) {
  try {
    const updated = await Badge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Badge non trouvé" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Erreur dans updateBadge :", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du badge", error: err });
  }
}

async deleteBadge(req: Request, res: Response) {
  try {
    const deleted = await Badge.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Badge non trouvé" });
    }

    res.status(204).send(); // ✅ Aucun contenu (conventionnel pour DELETE)
  } catch (err) {
    console.error("Erreur dans deleteBadge :", err);
    res.status(500).json({ message: "Erreur lors de la suppression du badge", error: err });
  }
}


  buildRouter(): Router {
    const router = Router();

    //router.use(sessionMiddleware);
    //router.use(isAdmin);

    router.get("/", this.getAllBadges.bind(this));
    router.get("/:id", this.getBadgeById.bind(this));
    router.post("/", this.createBadge.bind(this));
    router.put("/:id", this.updateBadge.bind(this));
    router.patch("/:id", this.updateBadge.bind(this));
    router.delete("/:id", this.deleteBadge.bind(this));

    return router;
  }
}
