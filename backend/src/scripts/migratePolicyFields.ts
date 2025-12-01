import { connectDatabase } from '../config/database';
import { Policy } from '../models';

/**
 * Migration script to rename policy fields:
 * - discounted_value → od_premium
 * - on_date_premium → total_premium_gst
 * - Add profit field (calculated)
 */
async function migratePolicyFields() {
  try {
    await connectDatabase();
    console.log('\n🔄 Starting Policy Fields Migration...\n');

    // Step 1: Rename discounted_value → od_premium
    console.log('📝 Step 1: Renaming discounted_value → od_premium');
    const renameDiscounted = await Policy.updateMany(
      { discounted_value: { $exists: true } },
      { $rename: { discounted_value: 'od_premium' } }
    );
    console.log(`   ✅ Updated ${renameDiscounted.modifiedCount} documents\n`);

    // Step 2: Rename on_date_premium → total_premium_gst
    console.log('📝 Step 2: Renaming on_date_premium → total_premium_gst');
    const renameOnDate = await Policy.updateMany(
      { on_date_premium: { $exists: true } },
      { $rename: { on_date_premium: 'total_premium_gst' } }
    );
    console.log(`   ✅ Updated ${renameOnDate.modifiedCount} documents\n`);

    // Step 3: Calculate and set profit for existing documents
    console.log('📝 Step 3: Calculating profit for existing documents');
    const policies = await Policy.find({});
    let profitUpdated = 0;

    for (const policy of policies) {
      const totalPremiumGst = (policy as any).total_premium_gst || 0;
      const premiumAmount = policy.premium_amount || 0;
      const agentCommission = policy.agent_commission || 0;

      // Calculate extra_amount and profit
      const extraAmount = totalPremiumGst - premiumAmount;
      const profit = agentCommission - extraAmount;

      // Update the document
      await Policy.updateOne(
        { _id: policy._id },
        {
          $set: {
            extra_amount: extraAmount,
            profit: profit,
          },
        }
      );
      profitUpdated++;
    }
    console.log(`   ✅ Calculated profit for ${profitUpdated} documents\n`);

    // Step 4: Remove old fields that might still exist
    console.log('📝 Step 4: Cleaning up old field references');
    const cleanupDiscounted = await Policy.updateMany(
      { discounted_value: { $exists: true } },
      { $unset: { discounted_value: '' } }
    );
    const cleanupOnDate = await Policy.updateMany(
      { on_date_premium: { $exists: true } },
      { $unset: { on_date_premium: '' } }
    );
    console.log(
      `   ✅ Cleaned up ${cleanupDiscounted.modifiedCount + cleanupOnDate.modifiedCount} documents\n`
    );

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - discounted_value → od_premium: ${renameDiscounted.modifiedCount} docs`);
    console.log(`   - on_date_premium → total_premium_gst: ${renameOnDate.modifiedCount} docs`);
    console.log(`   - profit calculated: ${profitUpdated} docs`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migratePolicyFields();
