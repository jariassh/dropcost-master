async function test() {
  const url = "https://bhtnphjrovsmzkdzakpc.supabase.co/functions/v1/drop-assistant";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodG5waGpyb3ZzbXprZHpha3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTM1MTAsImV4cCI6MjA4NzY4OTUxMH0.XJJwFOrVy8_s6y5wp_WnaC7LQhnJSsCV34lbSubPFKI";

  const body = {
      message: "Hola Max, me puedes contar los precios de DropCost Master?",
      roleSelected: "vendedor",
      depth: "standard",
      threadId: "test-session-script-04",
      isAnonymous: true,
      context: { 
          page: "/dashboard",
          app_url: "http://localhost:5173",
          referral_code: "foo123"
      },
      history: []
  };

  console.log("Enviando petición a Staging...");
  try {
      const res = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
      });
      const data = await res.text();
      console.log("Status:", res.status);
      console.log("Body:", data);
  } catch(e) {
      console.error(e);
  }
}

test();
