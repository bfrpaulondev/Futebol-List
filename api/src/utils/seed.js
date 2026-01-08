import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Game from '../models/Game.js';
import Transaction from '../models/Transaction.js';
import Suggestion from '../models/Suggestion.js';
import Message from '../models/Message.js';
import config from '../config/env.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Game.deleteMany({});
    await Transaction.deleteMany({});
    await Suggestion.deleteMany({});
    await Message.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@futebol.com',
        password: 'admin123',
        role: 'admin',
        skills: {
          shooting: 8,
          passing: 9,
          dribbling: 7,
          defense: 6,
          physical: 8,
          goalkeeping: 5
        },
        stats: {
          gamesPlayed: 25,
          wins: 15,
          draws: 5,
          losses: 5,
          goals: 12,
          assists: 18,
          mvpCount: 3
        }
      },
      {
        name: 'João Silva',
        email: 'joao@futebol.com',
        password: 'joao123',
        skills: {
          shooting: 7,
          passing: 8,
          dribbling: 9,
          defense: 5,
          physical: 7,
          goalkeeping: 4
        },
        preferredPosition: 'forward',
        stats: {
          gamesPlayed: 20,
          wins: 12,
          draws: 4,
          losses: 4,
          goals: 15,
          assists: 8,
          mvpCount: 2
        }
      },
      {
        name: 'Pedro Santos',
        email: 'pedro@futebol.com',
        password: 'pedro123',
        skills: {
          shooting: 6,
          passing: 7,
          dribbling: 6,
          defense: 8,
          physical: 9,
          goalkeeping: 5
        },
        preferredPosition: 'defender',
        stats: {
          gamesPlayed: 22,
          wins: 10,
          draws: 7,
          losses: 5,
          goals: 3,
          assists: 5,
          mvpCount: 1
        }
      },
      {
        name: 'Carlos Oliveira',
        email: 'carlos@futebol.com',
        password: 'carlos123',
        skills: {
          shooting: 5,
          passing: 6,
          dribbling: 5,
          defense: 7,
          physical: 6,
          goalkeeping: 9
        },
        preferredPosition: 'goalkeeper',
        stats: {
          gamesPlayed: 18,
          wins: 8,
          draws: 5,
          losses: 5,
          goals: 0,
          assists: 2,
          mvpCount: 2
        }
      },
      {
        name: 'Miguel Costa',
        email: 'miguel@futebol.com',
        password: 'miguel123',
        skills: {
          shooting: 8,
          passing: 7,
          dribbling: 8,
          defense: 6,
          physical: 7,
          goalkeeping: 4
        },
        preferredPosition: 'midfielder',
        stats: {
          gamesPlayed: 19,
          wins: 11,
          draws: 4,
          losses: 4,
          goals: 10,
          assists: 12,
          mvpCount: 2
        }
      },
      {
        name: 'Ricardo Pereira',
        email: 'ricardo@futebol.com',
        password: 'ricardo123',
        skills: {
          shooting: 9,
          passing: 6,
          dribbling: 7,
          defense: 5,
          physical: 8,
          goalkeeping: 4
        },
        preferredPosition: 'forward',
        stats: {
          gamesPlayed: 21,
          wins: 13,
          draws: 3,
          losses: 5,
          goals: 18,
          assists: 6,
          mvpCount: 4
        }
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create games
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(20, 0, 0, 0);
    
    const games = await Game.create([
      {
        date: nextWeek,
        location: 'Pavilhão Municipal',
        maxPlayers: 12,
        status: 'scheduled',
        attendees: [
          { user: users[0]._id, status: 'confirmed' },
          { user: users[1]._id, status: 'confirmed' },
          { user: users[2]._id, status: 'confirmed' },
          { user: users[3]._id, status: 'confirmed' },
          { user: users[4]._id, status: 'confirmed' },
          { user: users[5]._id, status: 'confirmed' }
        ],
        cost: {
          total: 60,
          perPlayer: 5
        },
        createdBy: users[0]._id
      }
    ]);
    
    console.log(`✅ Created ${games.length} games`);
    
    // Create transactions
    const transactions = await Transaction.create([
      {
        type: 'income',
        category: 'game_fee',
        amount: 60,
        description: 'Pagamento do jogo - 12 jogadores',
        date: new Date(),
        game: games[0]._id,
        createdBy: users[0]._id,
        isPaid: true
      },
      {
        type: 'expense',
        category: 'equipment',
        amount: 45,
        description: 'Compra de bola nova',
        date: new Date(),
        createdBy: users[0]._id,
        isPaid: true
      },
      {
        type: 'income',
        category: 'donation',
        amount: 20,
        description: 'Doação voluntária',
        date: new Date(),
        user: users[1]._id,
        createdBy: users[0]._id,
        isPaid: true
      }
    ]);
    
    console.log(`✅ Created ${transactions.length} transactions`);
    
    // Create suggestions
    const suggestions = await Suggestion.create([
      {
        title: 'Comprar coletes novos',
        description: 'Os coletes atuais estão muito velhos e rasgados. Precisamos de novos para distinguir os times.',
        category: 'equipment',
        estimatedCost: 30,
        status: 'pending',
        createdBy: users[1]._id,
        votes: [
          { user: users[0]._id },
          { user: users[2]._id },
          { user: users[3]._id }
        ]
      },
      {
        title: 'Organizar torneio de fim de ano',
        description: 'Que tal organizarmos um torneio amigável com outros grupos? Pode ser divertido!',
        category: 'event',
        estimatedCost: 100,
        status: 'pending',
        createdBy: users[4]._id,
        votes: [
          { user: users[1]._id },
          { user: users[5]._id }
        ]
      }
    ]);
    
    console.log(`✅ Created ${suggestions.length} suggestions`);
    
    // Create messages
    const messages = await Message.create([
      {
        user: users[0]._id,
        content: 'Bem-vindos ao chat do grupo! 🎉',
        type: 'text',
        channel: 'general'
      },
      {
        user: users[1]._id,
        content: 'Opa! Confirmado para o jogo de sábado! ⚽',
        type: 'text',
        channel: 'general'
      },
      {
        user: users[2]._id,
        content: 'Também estou! Vai ser show 🔥',
        type: 'text',
        channel: 'general'
      }
    ]);
    
    console.log(`✅ Created ${messages.length} messages`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@futebol.com / admin123');
    console.log('User: joao@futebol.com / joao123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
