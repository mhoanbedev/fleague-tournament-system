import express, { Express } from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan" 
import helmet from "helmet"
import * as database from "./configs/database"
import mainV1Routes from "./routes/index.routes"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware"

dotenv.config();
const app: Express = express();
const port: number | string = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan("dev"));

database.connect();

app.set("trust proxy", 1);

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "FLeague API is running...",
        timestamp: new Date().toISOString(),
    })
})
mainV1Routes(app)

app.use(notFoundHandler);
app.use(errorHandler);


app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})