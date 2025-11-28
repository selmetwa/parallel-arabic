#!/usr/bin/env node
/**
 * Migration script to upload all structured lesson JSON files to Supabase storage
 * 
 * Usage:
 *   npm run upload:lessons
 *   npm run upload:lessons -- --dry-run  (preview without uploading)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const LESSONS_DIR = path.resolve(__dirname, '../src/lib/data/lessons');
const STRUCTURED_LESSONS_BUCKET = 'structured_lesson';

// Try multiple environment variable names for flexibility
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                              process.env.SUPABASE_SERVICE_KEY || 
                              process.env.SUPABASE_ANON_KEY;

const isDryRun = process.argv.includes('--dry-run');

const dialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];

async function uploadLessons() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase credentials. Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        process.exit(1);
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('🚀 Starting lesson upload to Supabase storage...');
    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No files will be uploaded');
    }
    console.log(`📁 Reading from: ${LESSONS_DIR}`);
    console.log(`☁️  Uploading to bucket: ${STRUCTURED_LESSONS_BUCKET}`);
    
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const dialect of dialects) {
        const dialectDir = path.join(LESSONS_DIR, dialect);
        
        try {
            // Check if dialect directory exists
            await fs.access(dialectDir);
            
            console.log(`\n📂 Processing dialect: ${dialect}`);
            
            // Read all JSON files in the dialect directory
            const files = await fs.readdir(dialectDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            console.log(`   Found ${jsonFiles.length} lesson files`);
            
            for (const file of jsonFiles) {
                const filePath = path.join(dialectDir, file);
                const storagePath = `${dialect}/${file}`;
                
                try {
                    // Read the file content
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    
                    if (isDryRun) {
                        console.log(`   🔍 Would upload ${file} to ${storagePath}`);
                        totalUploaded++;
                    } else {
                        // Upload to Supabase storage
                        const { error } = await supabase.storage
                            .from(STRUCTURED_LESSONS_BUCKET)
                            .upload(storagePath, fileContent, {
                                contentType: 'application/json',
                                upsert: true // Allow overwriting if file exists
                            });
                        
                        if (error) {
                            // With upsert: true, we shouldn't get duplicate errors, but handle other errors
                            console.error(`   ❌ Error uploading ${file}:`, error.message);
                            totalErrors++;
                        } else {
                            console.log(`   ✅ Uploaded ${file} to ${storagePath}`);
                            totalUploaded++;
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Error reading/uploading ${file}:`, error);
                    totalErrors++;
                }
            }
        } catch (error) {
            console.error(`❌ Error accessing dialect directory ${dialect}:`, error);
            totalErrors++;
        }
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Successfully uploaded: ${totalUploaded}`);
    console.log(`   ⏭️  Skipped (already exists): ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log(`   📦 Total processed: ${totalUploaded + totalSkipped + totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 All lessons uploaded successfully!');
    } else {
        console.log('\n⚠️  Some errors occurred. Please review the output above.');
    }
}

// Run the upload
uploadLessons().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

