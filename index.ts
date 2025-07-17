import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { openConnection, SessionService, UserService } from "./services/mongoose";
import { UserRole } from "./models";
import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller"; // Ajout

// Importation des autres routes CRUD
import badgeRoutes from "./routes/badge.routes";
//import gymRoomRoutes from "./routes/gym-room.routes";
import challengeRoutes from "./routes/challenge.routes";
import exerciseTypeRoutes from "./routes/exercise-type.routes";
import trainingStatsRoutes from "./routes/training-stats.routes";

config();

async function startAPI() {
    const connection = await openConnection();
    const userService = new UserService(connection);
    const sessionService = new SessionService(connection);
    await bootstrapAPI(userService);
    const app = express();
    app.use(cors());
    app.use(express.json());

    const userController = new UserController(userService, sessionService);
    const userRouter = userController.buildRouter.bind(userController)();
    app.use('/users', userRouter);
    app.use('/badges', badgeRoutes);
   // app.use('/gym-rooms', gymRoomRoutes);
    app.use('/challenges', challengeRoutes);
    app.use('/exercise-types', exerciseTypeRoutes);
    app.use('/training-stats', trainingStatsRoutes);

    const authController = new AuthController(userService, sessionService);
    app.use('/auth', authController.buildRouter.bind(authController)());

    app.listen(process.env.PORT, () => console.log(`API listening on port ${process.env.PORT}...`));
}

async function bootstrapAPI(userService: UserService) {
    if (typeof process.env.TSNESSGYM_ROOT_EMAIL === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_EMAIL is not defined');
    }
    if (typeof process.env.TSNESSGYM_ROOT_PASSWORD === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_PASSWORD is not defined');
    }
    const rootUser = await userService.findUser(process.env.TSNESSGYM_ROOT_EMAIL);
    if (!rootUser) { // first launch API
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
    }
}

startAPI().catch(console.error);