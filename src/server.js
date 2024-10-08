const express = require("express");
const app = express();
const PORT = 8080;
app.use(express.static("public"));
const cors = require("cors");
const { Sequelize, Model, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize("ecommerce", "local", "123456", {
  host: "localhost",
  dialect: "mysql",
});

const User = sequelize.define("user", {
  nombre: DataTypes.TEXT,
  apellido: DataTypes.TEXT,
  dni: DataTypes.STRING(8),
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  celular: DataTypes.STRING(8),
  password: {
    type: DataTypes.STRING,
    validate: {
      min: 8,
    },
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

const Product = sequelize.define("product", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  imagePath: DataTypes.STRING,
  price: DataTypes.INTEGER,
});

(async () => {
  await sequelize.sync({ force: false });
})();
sequelize
  .authenticate()
  .then(() => console.log("Connection has been established successfully."));

app.get("/", async (req, res) => {
  res.status(200).json([
    {
      title: "Boedo",
      id: "1",
      description:
        "Set de tazas con platos - Ideal para una buena juntada con amigos",
      imagePath: "/img/taza-1.jpeg",
      price: 29856,
    },
    {
      title: "Cañada",
      id: "2",
      description:
        "Set de Platos - Ideal para ensaladas y guisitos o pastas invernales.",
      imagePath: "/img/plato-ceramica-1.jpeg",
      price: 21600,
    },
    {
      title: "Chacarita",
      id: "3",
      description: "Set de Platos - Ideal para servir postres",
      imagePath: "/img/plato-playo-1.jpeg",
      price: 29856,
    },
    {
      title: "Pompeya",
      id: "4",
      description: "Set de Tazas - Para el frío.",
      imagePath: "/img/set-plato-1.jpeg",
      price: 72960,
    },
    {
      title: "Tablada",
      id: "5",
      description: "Set de Platos - Ideal para café.",
      imagePath: "/img/set-plato-2.jpeg",
      price: 37600,
    },
    {
      title: "La Boca",
      id: "6",
      description: "Set de Platos - Ideal para pasar un buen rato con amigas.",
      imagePath: "/img/taza-2.jpeg",
      price: 54200,
    },
    {
      title: "Balvarena",
      id: "7",
      description: "Set de Bowlicito - Ideal para ricas picadas.",
      imagePath: "/img/bowlcito.jpeg",
      price: 30000,
    },
    {
      title: "Recoleta",
      id: "8",
      description: "Set de Hondos - Ideal para ricas sopas.",
      imagePath: "/img/hondo-recoleta.jpeg",
      price: 24500,
    },
    {
      title: "Alberdi",
      id: "9",
      description: "Set de Platos - Ideales para comida al horno.",
      imagePath: "/img/alberdi.jpeg",
      price: 70200,
    },
    {
      title: "Cofico",
      id: "10",
      description: "Budinera - Ideales para ricos postres.",
      imagePath: "/img/cofico.jpeg",
      price: 30000,
    },
    {
      title: "Tanti",
      id: "11",
      description: "Set de Tazas - Ideales para mates cocidos.",
      imagePath: "/img/tanti.jpeg",
      price: 30000,
    },
    {
      title: "Carlos paz",
      id: "12",
      description: "Set de Platos - Ideales para suegras.",
      imagePath: "/img/carlos-paz.jpeg",
      price: 36000,
    },
  ]);
});

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

app.post("/InitialLogin", async (req, res) => {
  const { nombre, apellido, dni, celular, email, password } = req.body;

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  if (!nombre || !apellido || !dni || !celular || !email || !password) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: "El usuario ya existe" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      nombre,
      apellido,
      dni,
      email,
      celular,
      password: hashedPassword,
      isAdmin: false,
    });
    const existingAdmin = await User.findOne({ where: { isAdmin: true } });
    if (!existingAdmin) {
      try {
        await User.create({
          nombre: "Admin",
          apellido: "Admin",
          dni: "1",
          email: "adm@gmail.com",
          celular: "1",
          password: await hashPassword("adm123"),
          isAdmin: true,
        });
        console.log("Admin user created");
      } catch (error) {
        console.error("Error creating admin user:", error);
      }
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/Login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: "Usuario no encontrado",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    const token = jwt.sign({ userId: user._id }, "tu_secreto_aqui", {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { nombre: user.nombre },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/Register", async (req, res) => {
  const { title, description, price } = req.body;

  if (!title || !description || !price) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newProduct = await Product.create({
      title,
      description,
      price,
    });
    res
      .status(201)
      .json({ success: true, message: "Product created successfully" });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const allProducts = await Product.findAll();
    res.status(200).json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

app.listen(PORT, () => console.log(`escuchando en el puerto ${PORT}`));
