import {config} from "dotenv";
import express from "express";
import cors from "cors";
import {openConnection, SessionService, UserService} from "./services/mongoose";
import {UserRole} from "./models";
import {AuthController} from "./controllers/auth.controller";
config();

async function startAPI() {
    const connection = await openConnection();
    const userService = new UserService(connection);
    const sessionService = new SessionService(connection);
    await bootstrapAPI(userService);
    const app = express();
    app.use(cors());
    const authController = new AuthController(userService, sessionService);
    app.use('/auth', authController.buildRouter());
    app.listen(process.env.PORT, () => console.log(`API listening on port ${process.env.PORT}...`))
}

async function bootstrapAPI(userService: UserService) {
    if(typeof process.env.TSNESSGYM_ROOT_EMAIL === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_EMAIL is not defined');
    }
    if(typeof process.env.TSNESSGYM_ROOT_PASSWORD === 'undefined') {
        throw new Error('TSNESSGYM_ROOT_PASSWORD is not defined');
    }
    const rootUser = await userService.findUser(process.env.TSNESSGYM_ROOT_EMAIL);
    if(!rootUser) { // first launch API
        await userService.createUser({
            firstName: 'root',
            lastName: 'root',
            password: process.env.TSNESSGYM_ROOT_PASSWORD,
            email: process.env.TSNESSGYM_ROOT_EMAIL,
            role: UserRole.ADMIN
        });
    }
}

startAPI().catch(console.error);