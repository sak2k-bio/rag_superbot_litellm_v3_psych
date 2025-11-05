#!/usr/bin/env node

/**
 * Qdrant Collection Setup Script
 * Run with: node setup-qdrant-collection.mjs
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

const QDRANT_CLOUD_URL = process.env.NEXT_PUBLIC_QDRANT_CLOUD_URL;
const QDRANT_CLOUD_API_KEY = process.env.NEXT_PUBLIC_QDRANT_CLOUD_API_KEY;
const COLLECTION_NAME = process.env.NEXT_PUBLIC_COLLECTION_NAME || 'psychiatry_therapy_v1_google-001';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const EMBEDDING_MODEL = process.env.NEXT_PUBLIC_EMBEDDING_MODEL || 'embedding-001';
const EMBEDDING_DIM = parseInt(process.env.NEXT_PUBLIC_EMBEDDING_DIM || '3072');

async function main() {
  console.log("🔧 Qdrant Collection Setup\n");

  // Validate environment variables
  if (!QDRANT_CLOUD_URL || !QDRANT_CLOUD_API_KEY) {
    console.error("❌ Qdrant Cloud credentials not found in .env.local");
    console.log("Please ensure NEXT_PUBLIC_QDRANT_CLOUD_URL and NEXT_PUBLIC_QDRANT_CLOUD_API_KEY are set");
    process.exit(1);
  }

  if (!GOOGLE_API_KEY) {
    console.error("❌ Google API key not found in .env.local");
    console.log("Please ensure NEXT_PUBLIC_GOOGLE_API_KEY is set");
    process.exit(1);
  }

  console.log(`🔍 Configuration:`);
  console.log(`  Qdrant URL: ${QDRANT_CLOUD_URL}`);
  console.log(`  Collection: ${COLLECTION_NAME}`);
  console.log(`  Embedding Model: ${EMBEDDING_MODEL}`);
  console.log(`  Vector Dimensions: ${EMBEDDING_DIM}\n`);

  try {
    // Initialize Qdrant client
    const client = new QdrantClient({
      url: QDRANT_CLOUD_URL,
      apiKey: QDRANT_CLOUD_API_KEY
    });

    // Check existing collections
    console.log("🔍 Checking existing collections...");
    const collections = await client.getCollections();

    console.log(`📋 Found ${collections.collections.length} collections:`);
    collections.collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    console.log();

    // Check if target collection exists
    const existingCollection = collections.collections.find(col => col.name === COLLECTION_NAME);

    if (existingCollection) {
      console.log(`✅ Collection '${COLLECTION_NAME}' already exists!`);

      // Get collection info
      const info = await client.getCollection(COLLECTION_NAME);
      const vectorSize = info.config?.params?.vectors?.size;
      console.log(`📊 Vector dimensions: ${vectorSize}`);

      if (vectorSize !== EMBEDDING_DIM) {
        console.log(`⚠️  Warning: Collection vector size (${vectorSize}) doesn't match configured embedding dimensions (${EMBEDDING_DIM})`);
      }

      // Get collection stats
      const collectionInfo = await client.getCollection(COLLECTION_NAME);
      console.log(`📈 Collection stats:`);
      console.log(`  - Points count: ${collectionInfo.points_count || 0}`);
      console.log(`  - Status: ${collectionInfo.status}`);

    } else {
      console.log(`❌ Collection '${COLLECTION_NAME}' not found`);
      console.log(`🚀 Creating collection with ${EMBEDDING_DIM} dimensions...`);

      // Create the collection
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIM,
          distance: 'Cosine'
        }
      });

      console.log(`✅ Collection '${COLLECTION_NAME}' created successfully!`);

      // Verify creation
      const newInfo = await client.getCollection(COLLECTION_NAME);
      console.log(`📊 New collection vector dimensions: ${newInfo.config?.params?.vectors?.size}`);
    }

    // Test embedding generation
    console.log("\n🧪 Testing embedding generation...");
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const testText = "This is a test for the RAG system.";
    const result = await model.embedContent(testText);
    const embedding = result.embedding.values;

    console.log(`✅ Successfully generated ${embedding.length}-dimensional embedding`);

    if (embedding.length !== EMBEDDING_DIM) {
      console.log(`⚠️  Warning: Generated embedding size (${embedding.length}) doesn't match configured size (${EMBEDDING_DIM})`);
      console.log(`💡 Consider updating NEXT_PUBLIC_EMBEDDING_DIM to ${embedding.length}`);
    }

    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Load sample documents: npm run dev (then use 'Load Sample Docs' button)");
    console.log("2. Or upload your own documents via the /api/documents endpoint");
    console.log("3. Start chatting with your RAG system!");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.log("💡 Check your Qdrant Cloud API key permissions");
    } else if (error.message.includes('API_KEY_INVALID')) {
      console.log("💡 Check your Google API key");
    } else {
      console.log("💡 Full error details:", error);
    }

    process.exit(1);
  }
}

// Run the setup
main().catch(console.error);
