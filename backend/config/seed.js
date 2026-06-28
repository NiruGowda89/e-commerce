const Product = require('../models/Product');

async function seed() {
  try {
    const count = await Product.count();
    if (count === 0) {
      await Product.bulkCreate([
        {
          productName: "Classic Shirt",
          category: "Shirts",
          brand: "Urban Man",
          price: 999.0,
          size: "M",
          color: "Blue",
          stock: 50,
          imageUrl: "images/shirt.jpg",
          description: "Premium cotton shirt for formal wear."
        },
        {
          productName: "Casual T-Shirt",
          category: "T-Shirts",
          brand: "Urban Man",
          price: 499.0,
          size: "L",
          color: "Black",
          stock: 75,
          imageUrl: "images/tshirt.jpg",
          description: "Comfortable everyday casual t-shirt."
        },
        {
          productName: "Premium Linen Shirt",
          category: "New Collection",
          brand: "Urban Man",
          price: 1299.0,
          size: "M",
          color: "White",
          stock: 30,
          imageUrl: "images/linen.jpg",
          description: "Luxury breathable linen shirt."
        },
        {
          productName: "Slim Fit Jeans",
          category: "Jeans",
          brand: "Urban Man",
          price: 1499.0,
          size: "L",
          color: "Blue",
          stock: 60,
          imageUrl: "images/jeans.jpg",
          description: "Modern slim-fit denim jeans."
        }
      ]);
      console.log('Database seeded with default products successfully.');
    } else {
      console.log('Database already has products. Skipping seed.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

module.exports = seed;
