/**
 * Script to check the first responder credentials in the database
 * 
 * Run this script with node:
 * node check_database.js
 */

// Use ESM import in Node with require
const { createClient } = require('@supabase/supabase-js');

// Use environment variables or import from a secure config file
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('Checking first responder accounts in the database...');
  
  try {
    // Get all credentials (in a real app, limit this or use admin privileges)
    const { data, error } = await supabase
      .from('firstresponder_credentials')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${data.length} first responder accounts`);
    
    // Check if responder1 exists without showing sensitive information
    const responder1 = data.find(cred => cred.username === 'responder1');
    if (responder1) {
      console.log('\nFound responder1 account:');
      console.log('Username:', responder1.username);
      console.log('Password: [REDACTED]');
      console.log('Created at:', responder1.created_at);
    } else {
      console.log('\nresponder1 account not found in the database');
    }
    
    // Provide useful information without showing actual credentials
    console.log('\nTo update a password, use the admin interface or a secure password update function');

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase(); 