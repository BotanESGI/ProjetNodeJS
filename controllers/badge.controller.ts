import { Router, Request, Response } from "express";
import Badge from "../services/mongoose/schema/badge.schema";
import { sessionMiddleware, isAdmin } from "../middlewares";
import { SessionService } from "../services/mongoose";
import mongoose from "mongoose";

export class BadgeController {
  constructor(public readonly sessionService: SessionService) {
  }

  async getAllBadges(req: Request, res: Response) {
    const badges = await Badge.find();
    res.json(badges);
  }

  async getBadgeById(req: Request, res: Response) {
    const {id} = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: "Identifiant de badge invalide"});
    }
    const badge = await Badge.findById(id);
    if (!badge) {
      return res.status(404).json({message: "Badge non trouvé"});
    }
    res.status(200).json(badge);
  }

  async createBadge(req: Request, res: Response) {
    const {name, description, rule, iconUrl} = req.body;
    if (!name || !description || !rule) {
      return res.status(400).json({message: "Champs requis : name, description, rule"});
    }
    const existing = await Badge.findOne({$or: [{name}, {rule}]});
    if (existing) {
      return res.status(409).json({message: "Un badge avec ce nom ou cette règle existe déjà."});
    }
    const newBadge = await Badge.create({name, description, rule, iconUrl});
    res.status(201).json(newBadge);
  }

  async updateBadge(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Identifiant de badge invalide" });
    }
    if (!name && !description) {
      return res.status(400).json({ message: "Au moins le nom ou la description doit être renseigné." });
    }

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;

    const updated = await Badge.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Badge non trouvé" });
    }
    res.status(200).json(updated);
  }

  async deleteBadge(req: Request, res: Response) {
    const {id} = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: "Identifiant de badge invalide"});
    }
    const deleted = await Badge.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({message: "Badge non trouvé"});
    }
    res.status(204).send();
  }

  buildRouter(): Router {
    const router = Router();

    router.get('/',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.getAllBadges.bind(this)
    );
    router.get('/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.getBadgeById.bind(this)
    );
    router.post('/',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.createBadge.bind(this)
    );

    router.put(['/', ''],
        sessionMiddleware(this.sessionService),
        isAdmin,
        (req, res) => res.status(400).json({ message: "Identifiant obligatoire" })
    );

    router.put('/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.updateBadge.bind(this)
    );
    router.patch('/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.updateBadge.bind(this)
    );

    router.delete(['/', ''],
        sessionMiddleware(this.sessionService),
        isAdmin,
        (req, res) => res.status(400).json({ message: "Identifiant obligatoire" })
    );

    router.delete('/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.deleteBadge.bind(this)
    );

    return router;
  }
}