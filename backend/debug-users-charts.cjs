const mongoose = require('mongoose');
require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/excel-analytics')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check users in database
    const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
    console.log('👥 Found', users.length, 'users in database');
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\n👤 First user:');
      console.log('- ID:', user._id);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Created:', user.createdAt);
    }
    
    // Now check if charts have user references
    const chartsWithUsers = await mongoose.connection.db.collection('charthistories').find({
      user: { $exists: true }
    }).limit(5).toArray();
    
    console.log('\n📊 Charts with user references:', chartsWithUsers.length);
    
    const chartsWithoutUsers = await mongoose.connection.db.collection('charthistories').find({
      user: { $exists: false }
    }).limit(5).toArray();
    
    console.log('📊 Charts without user references:', chartsWithoutUsers.length);
    
    if (chartsWithUsers.length > 0) {
      console.log('\n✅ Sample chart with user:');
      console.log('- Chart:', chartsWithUsers[0].chartTitle);
      console.log('- User ID:', chartsWithUsers[0].user);
    }
    
    if (chartsWithoutUsers.length > 0) {
      console.log('\n⚠️ Sample chart without user:');
      console.log('- Chart:', chartsWithoutUsers[0].chartTitle);
      console.log('- Has userId field:', 'userId' in chartsWithoutUsers[0]);
      console.log('- Has user field:', 'user' in chartsWithoutUsers[0]);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database error:', err);
    process.exit(1);
  });