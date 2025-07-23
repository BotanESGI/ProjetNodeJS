import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { openConnection, SessionService, UserService } from "./services/mongoose";
import { UserRole } from "./models";
import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller";
import { BadgeController} from "./controllers/badge.controller";
import { RewardController } from "./controllers/reward.controller";
import { TrainingStatsController } from './controllers/training-stats.controller';
import { ExerciseController } from "./controllers/exercise-type.controller";

// Importation des autres routes CRUD
//import gymRoomRoutes from "./routes/gym-room.routes";
//import challengeRoutes from "./routes/challenge.routes";
import { ChallengeController} from "./controllers/challenge.controller";
import { GymRoomController } from "./controllers/gym-room.controller";

config();

async function startAPI() {
    const connection = await openConnection();
    const userService = new UserService(connection);
    const sessionService = new SessionService(connection);
    const gymRoomController = new GymRoomController(sessionService);
    const gymRoomRouter = gymRoomController.buildRouter.bind(gymRoomController)();
    const challengeController = new ChallengeController(sessionService);
    const exerciseController = new ExerciseController(sessionService);
    const exerciseRouter = exerciseController.buildRouter.bind(exerciseController)();
    const rewardController = new RewardController(sessionService);
    const rewardRouter = rewardController.buildRouter();

    await bootstrapAPI(userService);
    const app = express();
    app.use(cors());
    app.use(express.json());
    const userController = new UserController(userService, sessionService);
    const userRouter = userController.buildRouter.bind(userController)();
    const badgeController = new BadgeController(sessionService);
    const badgeRouter = badgeController.buildRouter.bind(badgeController)();
    const challengeRouter = challengeController.buildRouter.bind(challengeController)();
    const trainingStatsController = new TrainingStatsController(sessionService);

    app.use('/users', userRouter); 
    app.use('/challenges', challengeRouter);
    app.use('/gym-rooms', gymRoomRouter);
    app.use('/exercises', exerciseRouter);
    app.use('/badges', badgeRouter);
    app.use('/rewards', rewardRouter);
    app.use('/training-stats', trainingStatsController.buildRouter());

    const authController = new AuthController(userService, sessionService);
    app.use('/auth', authController.buildRouter.bind(authController)());
 app.post('/admin/give-reward', (req, res) =>
        rewardController.giveReward(req, res)
    );
    app.listen(process.env.PORT, () => console.log(`API listening on port ${process.env.PORT}...`));
}

async function bootstrapAPI(userService: UserService) {
     // Admin
    if (typeof process.env.TSNESSGYM_ROOT_EMAIL === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_EMAIL is not defined');
    }
    if (typeof process.env.TSNESSGYM_ROOT_PASSWORD === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_PASSWORD is not defined');
    }
    const rootUser = await userService.findUser(process.env.TSNESSGYM_ROOT_EMAIL);
    if (!rootUser) {
        await userService.createUser({
            username: 'root',
            firstName: 'Admin',
            lastName: 'Principal',
            password: process.env.TSNESSGYM_ROOT_PASSWORD,
            email: process.env.TSNESSGYM_ROOT_EMAIL,
            role: UserRole.ADMIN,
            isActive: true,
            badges: []
        });
        console.log('Admin créé automatiquement');
    }

    // Owner
    if (!process.env.TSNESSGYM_OWNER_EMAIL || !process.env.TSNESSGYM_OWNER_PASSWORD) {
        throw new Error('TSNESSGYM_OWNER_EMAIL or TSNESSGYM_OWNER_PASSWORD is not defined');
    }
    const owner = await userService.findUser(process.env.TSNESSGYM_OWNER_EMAIL);
    if (!owner) {
        await userService.createUser({
            username: 'owner',
            firstName: 'Owner',
            lastName: 'Test',
            password: process.env.TSNESSGYM_OWNER_PASSWORD,
            email: process.env.TSNESSGYM_OWNER_EMAIL,
            role: UserRole.OWNER,
            isActive: true,
            badges: []
        });
        console.log('Owner créé automatiquement');
    }

    // User
    if (!process.env.TSNESSGYM_USER_EMAIL || !process.env.TSNESSGYM_USER_PASSWORD) {
        throw new Error('TSNESSGYM_USER_EMAIL or TSNESSGYM_USER_PASSWORD is not defined');
    }
    const normalUser = await userService.findUser(process.env.TSNESSGYM_USER_EMAIL);
    if (!normalUser) {
        await userService.createUser({
            username: 'user',
            firstName: 'User',
            lastName: 'Test',
            password: process.env.TSNESSGYM_USER_PASSWORD,
            email: process.env.TSNESSGYM_USER_EMAIL,
            role: UserRole.USER,
            isActive: true,
            badges: []
        });
        console.log('User créé automatiquement');
    }
}

startAPI().catch(console.error);