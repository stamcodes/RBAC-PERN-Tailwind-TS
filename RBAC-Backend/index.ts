import express from "express";
import cors from "cors"; // 1. Import CORS package
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import roleRoutes from "./routes/roleRoutes";
import branchRoutes from "./routes/branchRoutes";
import permissionRoutes from "./routes/permissionRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";

const app = express();

// 2. Configure CORS to accept requests from your Frontend Vite port
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Required middleware to parse incoming JSON request bodies
app.use(express.json());

// SWAGGER CONFIGURATION SETUP
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Speakify RBAC API Documentation",
      version: "1.0.0",
      description: "API Contract Specifications",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.ts", "./docs/*.ts"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve the graphical UI interface page
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// All mounts for the routes.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📑 Swagger Documentation ready at http://localhost:${PORT}/api-docs`,
  );
});
