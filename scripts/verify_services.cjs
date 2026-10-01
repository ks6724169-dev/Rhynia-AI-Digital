/**
 * Rhynia Intelligence — 3-Point Production Health Audit
 * Automatically verifies:
 * 1. Supabase (Database connection & migrations)
 * 2. Render (Backend API deployment & /api/v1/health)
 * 3. Vercel (Frontend production web app)
 */

const https = require('https');
const { Client } = require('pg');

const SUPABASE_DB_URL = "postgresql://postgres.argbmsljgfmevthutqpu:Maniwh%402007zzzz@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
const RENDER_HEALTH_URL = "https://rhynia-ai-api.onrender.com/api/v1/health";
const VERCEL_APP_URL = "https://rhynia-ai-digital.vercel.app";

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });
  });
}

async function audit() {
  console.log("==================================================");
  console.log("🔍 RHYNIA INTELLIGENCE: 3-POINT SERVICES AUDIT");
  console.log("==================================================");
  let allHealthy = true;

  // 1. SUPABASE AUDIT
  console.log("\n[1/3] Checking Supabase Database...");
  try {
    const client = new Client({
      connectionString: SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
    const tableNames = res.rows.map(r => r.table_name);
    console.log(`✅ Supabase Connected! Total Tables: ${tableNames.length}`);
    console.log(`   Tables: ${tableNames.join(', ')}`);
    await client.end();
  } catch (err) {
    allHealthy = false;
    console.error(`❌ Supabase Error: ${err.message}`);
  }

  // 2. RENDER AUDIT
  console.log("\n[2/3] Checking Render Backend API...");
  try {
    const renderRes = await fetchUrl(RENDER_HEALTH_URL);
    if (renderRes.statusCode === 200) {
      console.log(`✅ Render Backend Live! Status: 200 OK`);
      console.log(`   Response: ${renderRes.data}`);
    } else {
      allHealthy = false;
      console.error(`❌ Render Error: HTTP ${renderRes.statusCode}`);
    }
  } catch (err) {
    allHealthy = false;
    console.error(`❌ Render Request Failed: ${err.message}`);
  }

  // 3. VERCEL AUDIT
  console.log("\n[3/3] Checking Vercel Frontend Web App...");
  try {
    const vercelRes = await fetchUrl(VERCEL_APP_URL);
    if (vercelRes.statusCode === 200) {
      console.log(`✅ Vercel Frontend Live! Status: 200 OK`);
      console.log(`   App URL: ${VERCEL_APP_URL}`);
    } else {
      allHealthy = false;
      console.error(`❌ Vercel Error: HTTP ${vercelRes.statusCode}`);
    }
  } catch (err) {
    allHealthy = false;
    console.error(`❌ Vercel Request Failed: ${err.message}`);
  }

  console.log("\n==================================================");
  if (allHealthy) {
    console.log("🎉 ALL 3 SERVICES ARE 100% HEALTHY & LIVE!");
  } else {
    console.log("⚠️ SOME SERVICES REQUIRE ATTENTION.");
  }
  console.log("==================================================");
}

audit();
