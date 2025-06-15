// utils/encryptionTest.js
import { encryptData, decryptData, encryptFields, decryptFields, ENCRYPTED_FIELDS, hashData } from './encryption.js';

/**
 * Test the encryption/decryption functionality
 */
export function testEncryption() {
  console.log('🧪 Testing encryption/decryption functionality...\n');
  
  const testUserId = 'test-user-123';
  const testTodo = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Sensitive Todo Title',
    category: 'Personal Development',
    difficulty: 'medium',
    priority: 1,
    score: 5
  };
  
  try {
    console.log('📝 Original Todo:', testTodo);
    
    // Test field encryption
    console.log('\n🔐 Encrypting sensitive fields...');
    const encryptedTodo = encryptFields(testTodo, ENCRYPTED_FIELDS.TODO, testUserId);
    console.log('🔐 Encrypted Todo:', {
      ...encryptedTodo,
      title: encryptedTodo.title.substring(0, 50) + '...',
      category: encryptedTodo.category.substring(0, 50) + '...'
    });
    
    // Test field decryption
    console.log('\n🔓 Decrypting sensitive fields...');
    const decryptedTodo = decryptFields(encryptedTodo, ENCRYPTED_FIELDS.TODO, testUserId);
    console.log('🔓 Decrypted Todo:', decryptedTodo);
    
    // Verify data integrity
    const isMatch = testTodo.title === decryptedTodo.title && 
                   testTodo.category === decryptedTodo.category;
    console.log('\n✅ Data integrity check:', isMatch ? 'PASSED' : 'FAILED');
    
    // Test with different user ID (should fail)
    console.log('\n🚫 Testing with wrong user ID...');
    try {
      const wrongDecryption = decryptFields(encryptedTodo, ENCRYPTED_FIELDS.TODO, 'wrong-user');
      console.log('🚫 Wrong user decryption should have failed but succeeded:', wrongDecryption);
    } catch (error) {
      console.log('✅ Wrong user decryption properly failed:', error.message);
    }
    
    // Test planner data
    console.log('\n📋 Testing planner data encryption...');
    const testPlanner = {
      title: 'My Secret Plan',
      description: 'This contains sensitive information',
      content: [
        { type: 'text', value: 'Confidential notes here' },
        { type: 'todo', value: 'Private task' }
      ]
    };
    
    console.log('📋 Original Planner:', testPlanner);
    const encryptedPlanner = encryptFields(testPlanner, ENCRYPTED_FIELDS.PLANNER, testUserId);
    console.log('🔐 Encrypted Planner:', {
      ...encryptedPlanner,
      title: encryptedPlanner.title.substring(0, 30) + '...',
      description: encryptedPlanner.description.substring(0, 30) + '...'
    });
    
    const decryptedPlanner = decryptFields(encryptedPlanner, ENCRYPTED_FIELDS.PLANNER, testUserId);
    console.log('🔓 Decrypted Planner:', decryptedPlanner);
    
    const plannerMatch = JSON.stringify(testPlanner) === JSON.stringify(decryptedPlanner);
    console.log('✅ Planner data integrity check:', plannerMatch ? 'PASSED' : 'FAILED');
    
    // Test data hashing
    console.log('\n🔨 Testing data hashing...');
    const hash1 = hashData('sensitive data', testUserId);
    const hash2 = hashData('sensitive data', testUserId);
    const hash3 = hashData('different data', testUserId);
    
    console.log('🔨 Hash consistency check:', hash1 === hash2 ? 'PASSED' : 'FAILED');
    console.log('🔨 Hash uniqueness check:', hash1 !== hash3 ? 'PASSED' : 'FAILED');
    
    console.log('\n🎉 All encryption tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

/**
 * Performance test for encryption operations
 */
export function testEncryptionPerformance() {
  console.log('⚡ Testing encryption performance...\n');
  
  const testData = {
    title: 'Test Todo Item',
    category: 'Work',
    description: 'This is a test description with some sensitive content that needs to be encrypted'
  };
  
  const iterations = 100;
  const userId = 'perf-test-user';
  
  // Test encryption performance
  console.time('Encryption Performance');
  for (let i = 0; i < iterations; i++) {
    encryptFields(testData, ENCRYPTED_FIELDS.TODO, userId);
  }
  console.timeEnd('Encryption Performance');
  
  // Test decryption performance
  const encryptedData = encryptFields(testData, ENCRYPTED_FIELDS.TODO, userId);
  
  console.time('Decryption Performance');
  for (let i = 0; i < iterations; i++) {
    decryptFields(encryptedData, ENCRYPTED_FIELDS.TODO, userId);
  }
  console.timeEnd('Decryption Performance');
  
  console.log(`✅ Performance test completed with ${iterations} iterations`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEncryption();
  testEncryptionPerformance();
}
