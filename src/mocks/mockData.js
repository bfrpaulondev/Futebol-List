// -.-.-.-
// Mock users database
export const mockUsers = [
  {
    _id: 'user1',
    name: 'Bruno Paulon',
    email: 'bruno@test.com',
    password: '123456', // Plain text for mock only
    phone: '+351 912345678',
    playerType: 'mensalista',
    position: 'ALA',
    avatar: null,
    role: 'admin',
    skills: {
      defense: 7,
      attack: 8,
      passing: 7,
      technique: 8,
      stamina: 7
    },
    overallRating: 7.4,
    stats: {
      gamesPlayed: 45,
      mvpCount: 8
    },
    notificationsEnabled: true,
    isActive: true
  },
  {
    _id: 'user2',
    name: 'João Silva',
    email: 'joao@test.com',
    password: '123456',
    phone: '+351 923456789',
    playerType: 'mensalista',
    position: 'DEF',
    avatar: null,
    role: 'player',
    skills: {
      defense: 8,
      attack: 5,
      passing: 6,
      technique: 6,
      stamina: 8
    },
    overallRating: 6.6,
    stats: {
      gamesPlayed: 42,
      mvpCount: 3
    },
    notificationsEnabled: true,
    isActive: true
  },
  {
    _id: 'user3',
    name: 'Pedro Costa',
    email: 'pedro@test.com',
    password: '123456',
    playerType: 'grupo',
    position: 'PIVO',
    avatar: null,
    role: 'player',
    skills: {
      defense: 6,
      attack: 8,
      passing: 7,
      technique: 7,
      stamina: 6
    },
    overallRating: 6.8,
    stats: {
      gamesPlayed: 30,
      mvpCount: 5
    },
    notificationsEnabled: true,
    isActive: true
  },
  {
    _id: 'user4',
    name: 'Ricardo Santos',
    email: 'ricardo@test.com',
    password: '123456',
    playerType: 'externo',
    position: 'GR',
    avatar: null,
    role: 'player',
    skills: {
      defense: 9,
      attack: 3,
      passing: 5,
      technique: 6,
      stamina: 7
    },
    overallRating: 6.0,
    stats: {
      gamesPlayed: 15,
      mvpCount: 2
    },
    notificationsEnabled: true,
    isActive: true
  }
];

// -.-.-.-
// Mock game data
export const mockGame = {
  _id: 'game1',
  date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  location: 'Pavilhão Municipal de Setúbal',
  maxPlayers: 12,
  attendees: [
    {
      player: mockUsers[0],
      confirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      playerType: 'mensalista',
      priority: 1
    },
    {
      player: mockUsers[1],
      confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      playerType: 'mensalista',
      priority: 1
    },
    {
      player: mockUsers[2],
      confirmedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      playerType: 'grupo',
      priority: 2
    }
  ],
  waitingList: [],
  teams: {
    teamA: [],
    teamB: []
  },
  result: {
    scoreA: 0,
    scoreB: 0
  },
  aiCoachComment: null,
  ratingsOpen: false,
  ratingsCloseAt: null,
  status: 'open'
};

// -.-.-.-
// Mock messages
export const mockMessages = [
  {
    _id: 'msg1',
    author: mockUsers[0],
    content: 'Boa tarde pessoal! Confirmem presença para sexta-feira 🔥',
    type: 'text',
    channel: 'general',
    isDeleted: false,
    readBy: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'msg2',
    author: mockUsers[1],
    content: 'Confirmado! 💪',
    type: 'text',
    channel: 'general',
    isDeleted: false,
    readBy: [],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

// -.-.-.-
// Mock balance
export const mockBalance = {
  current: 450.75,
  mensalistasCount: 8
};

// -.-.-.-
// Mock transactions
export const mockTransactions = [
  {
    _id: 'tx1',
    type: 'entrada',
    amount: 50,
    category: 'mensalidade',
    description: 'Mensalidade Janeiro - Bruno',
    isPaid: true,
    paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'tx2',
    type: 'saida',
    amount: 80,
    category: 'material',
    description: 'Compra de 2 bolas Futsal Pro',
    isPaid: true,
    paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'tx3',
    type: 'entrada',
    amount: 50,
    category: 'mensalidade',
    description: 'Mensalidade Janeiro - João',
    isPaid: true,
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// -.-.-.-
// Mock suggestions
export const mockSuggestions = [
  {
    _id: 'sug1',
    title: 'Novas Bolas Profissionais',
    description: 'Comprar 3 bolas oficiais para melhorar qualidade dos treinos',
    estimatedCost: 120,
    category: 'bolas',
    isPriority: true,
    votes: [mockUsers[0]._id, mockUsers[1]._id, mockUsers[2]._id],
    status: 'em-analise',
    createdBy: mockUsers[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'sug2',
    title: 'Coletes Novos',
    description: 'Coletes atuais estão desgastados, precisamos de um novo conjunto',
    estimatedCost: 60,
    category: 'coletes',
    isPriority: false,
    votes: [mockUsers[1]._id],
    status: 'aprovada',
    createdBy: mockUsers[1],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// -.-.-.-
// Mock coletes schedule
export const mockColeteSchedule = {
  _id: 'schedule1',
  year: 2025,
  months: [
    { month: 1, responsiblePlayer: mockUsers[0] },
    { month: 2, responsiblePlayer: mockUsers[1] },
    { month: 3, responsiblePlayer: mockUsers[2] },
    { month: 4, responsiblePlayer: mockUsers[0] },
    { month: 5, responsiblePlayer: mockUsers[1] },
    { month: 6, responsiblePlayer: mockUsers[2] },
    { month: 7, responsiblePlayer: mockUsers[0] },
    { month: 8, responsiblePlayer: mockUsers[1] },
    { month: 9, responsiblePlayer: mockUsers[2] },
    { month: 10, responsiblePlayer: mockUsers[0] },
    { month: 11, responsiblePlayer: mockUsers[1] },
    { month: 12, responsiblePlayer: mockUsers[2] }
  ]
};
