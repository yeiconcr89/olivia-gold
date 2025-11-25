import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

async function testCloudinaryAPI() {
  console.log('🔍 Testing Cloudinary Configuration...\n');
  
  console.log('Configuration:');
  console.log('  Cloud Name:', config.cloudinary.cloudName);
  console.log('  API Key:', config.cloudinary.apiKey ? `${config.cloudinary.apiKey.substring(0, 6)}...` : 'NOT SET');
  console.log('  API Secret:', config.cloudinary.apiSecret ? 'SET' : 'NOT SET');
  console.log('\n');

  try {
    console.log('📊 Fetching usage statistics...');
    const usage = await cloudinary.api.usage();
    console.log('✅ Usage API successful!');
    console.log('Usage data:', JSON.stringify(usage, null, 2));
  } catch (error: any) {
    console.error('❌ Usage API failed!');
    console.error('Error:', error.message);
    console.error('HTTP Code:', error.http_code);
    console.error('Full error:', error);
  }

  console.log('\n');

  try {
    console.log('📁 Fetching root folders...');
    const folders = await cloudinary.api.root_folders();
    console.log('✅ Folders API successful!');
    console.log('Folders:', JSON.stringify(folders, null, 2));
  } catch (error: any) {
    console.error('❌ Folders API failed!');
    console.error('Error:', error.message);
    console.error('HTTP Code:', error.http_code);
  }

  console.log('\n');

  try {
    console.log('🔍 Searching for images...');
    const result = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(5)
      .execute();
    console.log('✅ Search API successful!');
    console.log('Results:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('❌ Search API failed!');
    console.error('Error:', error.message);
    console.error('HTTP Code:', error.http_code);
  }
}

testCloudinaryAPI()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
