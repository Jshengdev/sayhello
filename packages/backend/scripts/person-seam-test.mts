// Direct seam test: the parallel person stage (HeyReach live; X/SixtyFour expected DEGRADED-loud).
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
const { runPersonStage } = await import("../src/scrape/person.js");
const res = await runPersonStage({ name: "Johnny Sheng", linkedinUrl: "https://www.linkedin.com/in/johnny--sheng/" });
console.log(`RESULT person=${res.person?.name ?? null} title=${res.person?.title ?? null} provenance=${res.person?.provenance}`);
console.log(`RESULT signals=${res.signals.length} bySource=${JSON.stringify(res.signals.reduce((m,s)=>(m[s.source]=(m[s.source]??0)+1,m),{} as Record<string,number>))}`);
console.log(`RESULT degraded=${JSON.stringify(res.degraded)}`);
