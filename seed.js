import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/src/models/User.js';
import MindMap from './server/src/models/MindMap.js';
import MindMapNode from './server/src/models/MindMapNode.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongodbUri = process.env.MONGODB_URI || 'mongodb+srv://rubenggbc_db_user:m0gNSmY5wzEOkg0s@mindinvis.axrbbmn.mongodb.net/mindinvis?retryWrites=true&w=majority';
    await mongoose.connect(mongodbUri, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await MindMap.deleteMany({});
    await MindMapNode.deleteMany({});

    // Create sample users
    console.log('\nCreating sample users...');
    const users = await User.create([
      {
        email: 'ruben@example.com',
        name: 'Ruben',
        password: 'password123'
      },
      {
        email: 'admin@example.com',
        name: 'Admin',
        password: 'admin123'
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample mind maps with nodes
    console.log('\nCreating sample mind maps...');
    
    // Mind Map 1: Introduction to AI
    const rootNode1 = await MindMapNode.create({
      id: 'root-1',
      text: 'Introduction to AI',
      type: 'root',
      x: 200,
      y: 400,
      backgroundColor: '#26c6da',
      borderColor: '#26c6da'
    });

    const childNodes1 = await MindMapNode.create([
      {
        id: 'node-1-1',
        text: 'What is AI?',
        type: 'pregunta',
        x: 50,
        y: 200,
        backgroundColor: '#4dd0e1',
        borderColor: '#26c6da',
        parent: rootNode1._id
      },
      {
        id: 'node-1-2',
        text: 'Machine Learning',
        type: 'respuesta',
        x: 250,
        y: 200,
        backgroundColor: '#80deea',
        borderColor: '#26c6da',
        parent: rootNode1._id
      },
      {
        id: 'node-1-3',
        text: 'Deep Learning',
        type: 'respuesta',
        x: 450,
        y: 200,
        backgroundColor: '#b3e5fc',
        borderColor: '#26c6da',
        parent: rootNode1._id
      }
    ]);

    const mindMap1 = await MindMap.create({
      title: 'Introduction to AI',
      description: 'A comprehensive overview of artificial intelligence',
      owner: users[0]._id,
      rootNode: rootNode1._id,
      nodes: [rootNode1._id, ...childNodes1.map(n => n._id)],
      category: 'Learning',
      aiGenerated: true,
      color: 'cyan',
      nodeCount: 4
    });

    // Mind Map 2: Web Development Project
    const rootNode2 = await MindMapNode.create({
      id: 'root-2',
      text: 'Web Development Project',
      type: 'root',
      x: 200,
      y: 400,
      backgroundColor: '#8b5cf6',
      borderColor: '#8b5cf6'
    });

    const childNodes2 = await MindMapNode.create([
      {
        id: 'node-2-1',
        text: 'Frontend',
        type: 'respuesta',
        x: 50,
        y: 200,
        backgroundColor: '#a78cd3',
        borderColor: '#8b5cf6',
        parent: rootNode2._id
      },
      {
        id: 'node-2-2',
        text: 'Backend',
        type: 'respuesta',
        x: 250,
        y: 200,
        backgroundColor: '#b79dd9',
        borderColor: '#8b5cf6',
        parent: rootNode2._id
      },
      {
        id: 'node-2-3',
        text: 'Database',
        type: 'respuesta',
        x: 450,
        y: 200,
        backgroundColor: '#cfb4df',
        borderColor: '#8b5cf6',
        parent: rootNode2._id
      }
    ]);

    const mindMap2 = await MindMap.create({
      title: 'Web Development Project',
      description: 'Plan for building a web application',
      owner: users[0]._id,
      rootNode: rootNode2._id,
      nodes: [rootNode2._id, ...childNodes2.map(n => n._id)],
      category: 'Work',
      aiGenerated: false,
      isStarred: true,
      color: 'purple',
      nodeCount: 4
    });

    // Mind Map 3: Personal Goals 2025
    const rootNode3 = await MindMapNode.create({
      id: 'root-3',
      text: '2025 Goals',
      type: 'root',
      x: 200,
      y: 400,
      backgroundColor: '#ec407a',
      borderColor: '#ec407a'
    });

    const childNodes3 = await MindMapNode.create([
      {
        id: 'node-3-1',
        text: 'Health & Fitness',
        type: 'respuesta',
        x: 50,
        y: 200,
        backgroundColor: '#f06292',
        borderColor: '#ec407a',
        parent: rootNode3._id
      },
      {
        id: 'node-3-2',
        text: 'Career Growth',
        type: 'respuesta',
        x: 250,
        y: 200,
        backgroundColor: '#f48fb1',
        borderColor: '#ec407a',
        parent: rootNode3._id
      },
      {
        id: 'node-3-3',
        text: 'Learning',
        type: 'respuesta',
        x: 450,
        y: 200,
        backgroundColor: '#f8bbd0',
        borderColor: '#ec407a',
        parent: rootNode3._id
      }
    ]);

    const mindMap3 = await MindMap.create({
      title: '2025 Goals',
      description: 'Personal and professional goals for 2025',
      owner: users[0]._id,
      rootNode: rootNode3._id,
      nodes: [rootNode3._id, ...childNodes3.map(n => n._id)],
      category: 'Personal',
      color: 'pink',
      nodeCount: 4
    });

    console.log(`Created 3 mind maps with 12 nodes`);

    console.log('\nDatabase seeded successfully!\n');
    console.log('Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Mind Maps: 3`);
    console.log(`   • Total Nodes: 12`);
    console.log('\nTest credentials:');
    console.log(`   Email: ruben@example.com`);
    console.log(`   Password: password123\n`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
