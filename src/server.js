require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`NurseFlow server running on port ${PORT}`);
  });
};

startServer();