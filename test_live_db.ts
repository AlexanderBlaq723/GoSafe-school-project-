import { query } from "./lib/db";

process.env.DB_HOST = "gosafe-db.cvak62gwmwof.eu-north-1.rds.amazonaws.com";
process.env.DB_USER = "13.53.70.17";
process.env.DB_PASSWORD = "Alex723atgosafedb";
process.env.DB_NAME = "incident_emergency_database";

async function main() {
  try {
    console.log("Connecting to database...");
    const userId = "PA000001";
    
    const q1 = "SELECT COUNT(*) as count FROM reports WHERE user_id = ?";
    console.log(`Executing query: ${q1} with params: [${userId}]`);
    
    const [totalReports] = await query(q1, [userId]);
    console.log("Query result for totalReports:", totalReports);
    
    // Let's also check the actual rows
    const allRows = await query("SELECT * FROM reports WHERE user_id = ?", [userId]);
    console.log(`Found ${allRows.length} full rows matching user_id = ${userId}`);
    
    if (allRows.length === 0) {
      console.log("Checking if ANY reports exist to verify the table...");
      const someReports = await query("SELECT id, user_id FROM reports LIMIT 5");
      console.log("Sample reports in table:", someReports);
    }
    
  } catch (error) {
    console.error("Connection or query failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
