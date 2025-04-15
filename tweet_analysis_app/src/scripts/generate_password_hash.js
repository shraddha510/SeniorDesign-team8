
const bcrypt = require('bcryptjs');

async function generateHash() {
  // Get the password from command line argument
  const password = process.argv[2];
  
  if (!password) {
    console.error('Please provide a password as argument: node generate_password_hash.js your_password');
    process.exit(1);
  }
  
  try {
    // Generate a salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Password Hash:');
    console.log(hash);
    
    console.log('\nSQL Insert Statement:');
    console.log(`INSERT INTO firstresponder_credentials (username, password_hash) VALUES ('username', '${hash}');`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 