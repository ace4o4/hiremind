import { generateSimliSessionToken } from 'simli-client';

const SIMLI_API_KEY = "ovk8hzmy5mjdgdmnmtwexm";
const faceIds = [
  "tmp9c84fa1b-d1ec-4c17-9005-ed9c68097d2d",
  "c2c5eb29-2ec8-4903-abd6-946460fae2fc",
  "5514e24d-6086-46a3-ace4-6a7264e5cb7c"
];

async function test() {
  for (const id of faceIds) {
    try {
      console.log(`Testing Face ID: ${id}`);
      const res = await generateSimliSessionToken({
        config: {
          faceId: id,
          handleSilence: true,
          maxSessionLength: 3600,
          maxIdleTime: 3600,
        },
        apiKey: SIMLI_API_KEY
      });
      console.log("SUCCESS:", res);
    } catch (e: any) {
      console.error(`FAILED for ${id}:`, e.message || e);
    }
  }
}

test();
