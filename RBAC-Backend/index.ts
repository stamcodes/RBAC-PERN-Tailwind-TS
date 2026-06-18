import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import roleRoutes from "./routes/roleRoutes";

import permissionRoutes from "./routes/permissionRoutes";
const app = express();

// Required middleware to parse incoming JSON request bodies
app.use(express.json());

// ==========================================
// SWAGGER CONFIGURATION SETUP
// ==========================================
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
  apis: ["./routes/*.ts"], // Only scan route files, not middleware
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve the graphical UI interface page
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount your authentication router routes
app.use("/api/auth", authRoutes);

// Mount your new User Administration management routes
app.use("/api/users", userRoutes);

app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📑 Swagger Documentation ready at http://localhost:${PORT}/api-docs`,
  );
});
