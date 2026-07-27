import { query } from "./lib/db";

async function main() {
  try {
    const [reportsSchema] = await query("DESCRIBE reports");
    const [passengersSchema] = await query("DESCRIBE passengers");
    
    console.log("--- REPORTS SCHEMA ---");
    console.log(reportsSchema);
    
    console.log("--- PASSENGERS SCHEMA ---");
    console.log(passengersSchema);
    
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
