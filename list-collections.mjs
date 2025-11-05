#!/usr/bin/env node

import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const QDRANT_CLOUD_URL = process.env.NEXT_PUBLIC_QDRANT_CLOUD_URL;
const QDRANT_CLOUD_API_KEY = process.env.NEXT_PUBLIC_QDRANT_CLOUD_API_KEY;
const COLLECTION_NAME = process.env.NEXT_PUBLIC_COLLECTION_NAME;

async function main() {
  console.log("📋 Listing all collections...\n");
  console.log(`🎯 Looking for: '${COLLECTION_NAME}'\n`);

  const client = new QdrantClient({
    url: QDRANT_CLOUD_URL,
    apiKey: QDRANT_CLOUD_API_KEY
  });

  try {
    const collections = await client.getCollections();

    console.log(`📊 Found ${collections.collections.length} collections:\n`);

    collections.collections.forEach((col, index) => {
      const isTarget = col.name === COLLECTION_NAME;
      const marker = isTarget ? '🎯' : '📄';
      console.log(`${marker} ${index + 1}. "${col.name}"`);

      if (col.name.includes('psychiatry') || col.name.includes('therapy')) {
        console.log(`   👆 This looks like a psychiatry/therapy collection!`);
      }

      // Check for similar names
      if (col.name.includes(COLLECTION_NAME.replace(/\s/g, '')) ||
        COLLECTION_NAME.includes(col.name.replace(/\s/g, ''))) {
        console.log(`   ⚠️  Similar to target collection name`);
      }
    });

    // Try to get info for each psychiatry-related collection
    console.log("\n🔍 Checking psychiatry/therapy collections for content:\n");

    for (const col of collections.collections) {
      if (col.name.includes('psychiatry') || col.name.includes('therapy')) {
        try {
          const info = await client.getCollection(col.name);
          console.log(`📊 Collection: "${col.name}"`);
          console.log(`   - Points: ${info.points_count}`);
          console.log(`   - Dimensions: ${info.config?.params?.vectors?.size}`);
          console.log(`   - Distance: ${info.config?.params?.vectors?.distance}\n`);
        } catch (error) {
          console.log(`❌ Error accessing "${col.name}": ${error.message}\n`);
        }
      }
    }

  } catch (error) {
    console.error("❌ Error listing collections:", error.message);
  }
}

main().catch(console.error);
