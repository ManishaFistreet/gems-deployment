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

console.log("PORT --", PORT);

app.use(cors());

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/items", itemRoutes);

app.use("/api/sales", salesItemRoutes);       
app.use("/api/customers", customerItemRoutes);


const {
  MONGO_URI,
  MONGO_USER,
  MONGO_PASS,
} = process.env;

mongoose
  .connect(MONGO_URI, {
    user: MONGO_USER,
    pass: MONGO_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});