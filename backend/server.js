const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const itemRoutes = require("./controllers/itemController");
const salesItemRoutes = require("./routes/salesRoutes");
const customerItemRoutes = require("./routes/customerRoute");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use("/api/products", productRoutes);
app.use("/api/items", itemRoutes);

app.use("/api/sales", salesItemRoutes);       
app.use("/api/customers", customerItemRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});