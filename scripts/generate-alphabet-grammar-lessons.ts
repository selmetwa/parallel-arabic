/**
 * Script to generate lessons for Alphabet and Grammar modules
 * 
 * Usage:
 * 1. Make sure GEMINI_API_KEY is set in your environment
 * 2. Run: npx tsx scripts/generate-alphabet-grammar-lessons.ts
 * 
 * Or use the web UI at: http://localhost:5173/generate-lesson
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5173';

const DIALECTS = [
    'egyptian-arabic',
    'levantine',
    'fusha',
    'darija'
];

const MODULES_TO_GENERATE = [
    'module-alphabet'
    // 'module-grammar' // Removed for now - will add later
];

async function generateLessonsForModule(moduleId: string, dialect: string) {
    console.log(`\n📚 Generating lessons for module: ${moduleId}, dialect: ${dialect}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-lesson-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dialect,
                moduleIds: [moduleId],
                generateAll: false
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }

        const result = await response.json();
        
        console.log(`✅ Module ${moduleId} (${dialect}):`);
        console.log(`   - Generated: ${result.summary.generated}`);
        console.log(`   - Skipped: ${result.summary.skipped}`);
        console.log(`   - Failed: ${result.summary.failed}`);
        console.log(`   - Duration: ${Math.round(result.summary.totalDuration / 1000)}s`);
        
        return result;
    } catch (error) {
        console.error(`❌ Error generating lessons for ${moduleId} (${dialect}):`, error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting lesson generation for Alphabet module...\n');
    
    const results: Array<{
        moduleId: string;
        dialect: string;
        success: boolean;
        result?: any;
        error?: string;
    }> = [];

    for (const moduleId of MODULES_TO_GENERATE) {
        // Alphabet lessons always use fusha dialect
        const dialects = moduleId === 'module-alphabet' ? ['fusha'] : DIALECTS;
        for (const dialect of dialects) {
            try {
                const result = await generateLessonsForModule(moduleId, dialect);
                results.push({
                    moduleId,
                    dialect,
                    success: true,
                    result
                });
                
                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                results.push({
                    moduleId,
                    dialect,
                    success: false,
                    error: (error as Error).message
                });
            }
        }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\n❌ Failed generations:');
        results
            .filter(r => !r.success)
            .forEach(r => {
                console.log(`   - ${r.moduleId} (${r.dialect}): ${r.error}`);
            });
    }
    
    console.log('\n✨ Done!');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { main };

