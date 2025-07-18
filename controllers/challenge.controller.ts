import Challenge from '../services/mongoose/schema/challenge.schema';
import User from '../services/mongoose/schema/user.schema';
import Badge from '../services/mongoose/schema/badge.schema';
import { Request, Response } from 'express';
import { UserRole } from '../models';


export const getAllChallenges = async (req: Request, res: Response) => {
    const challenges = await Challenge.find();
    res.json(challenges);
};

//fetch challenges created by users only
export const getUsersChallenge = async (req: Request, res: Response) =>{
  try {
    const challenges = await Challenge.find();

    const creatorIds = challenges.map(challenge => challenge.creatorId);

    const users = await User.find({ _id: { $in: creatorIds }, role: "user" });

    const userIdsSet = new Set(users.map(user => user._id.toString()));

    const filteredChallenges = challenges.filter(challenge =>
      userIdsSet.has(challenge.creatorId.toString())
    );

    res.json(filteredChallenges);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des challenges." });
  }
}

export const createChallenge = async (req: Request, res: Response) => {
    const challenge = new Challenge(req.body);
    await challenge.save();
    res.status(201).json(challenge);
};

export const updateChallenge = async (req: Request, res: Response) => {
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (challenge && challenge.status === 'completed' && challenge.creatorId) {
        await checkAndAwardBadges(challenge.creatorId.toString());
    }

    res.json(challenge);
};

export const deleteChallenge = async (req: Request, res: Response) => {
    await Challenge.findByIdAndDelete(req.params.id);
    res.status(204).end();
};

//  Vérifie les règles et ajoute les badges si nécessaire
async function checkAndAwardBadges(userId: string): Promise<void> {
    const user = await User.findById(userId).populate("badges");
    if (!user) return;

    const allBadges = await Badge.find();
    const earnedBadgeIds = user.badges.map((b: any) => b._id.toString());

    for (const badge of allBadges) {
        if (earnedBadgeIds.includes(badge._id.toString())) continue;

        if (badge.rule.startsWith("challenges_completed_")) {
            const target = parseInt(badge.rule.split("_").pop() || "0");
            const completedCount = await Challenge.countDocuments({ userId, status: "completed" });

            if (completedCount >= target) {
                user.badges.push(badge._id);
                console.log(`Badge attribué : ${badge.name}`);
            }
        }
    }

    await user.save();
}
