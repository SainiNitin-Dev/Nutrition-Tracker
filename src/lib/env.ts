type PublicEnv = {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type ServerEnv = PublicEnv & {
  databaseUrl: string;
  directUrl: string;
  supabaseServiceRoleKey: string;
  groqApiKey: string;
  groqChatModel: string;
};

function readEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv(): PublicEnv {
  return {
    appUrl: readEnv("NEXT_PUBLIC_APP_URL"),
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getServerEnv(): ServerEnv {
  return {
    ...getPublicEnv(),
    databaseUrl: readEnv("DATABASE_URL"),
    directUrl: readEnv("DIRECT_URL"),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    groqApiKey: readEnv("GROQ_API_KEY"),
    groqChatModel: process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile",
  };
}
