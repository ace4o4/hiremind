const HEYGEN_API_KEY = "sk_V2_hgu_kJaSmND9dt8_zisSmuKhu49wHa0ZsMhlibdX3UBgNiQs";

async function testHeygen() {
  try {
    console.log("Testing HeyGen API Key...");
    const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "x-api-key": HEYGEN_API_KEY
      }
    });

    if (!res.ok) {
      console.error(`Status: ${res.status}`);
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    console.log("SUCCESS! Access Token:", data?.data?.token);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testHeygen();
