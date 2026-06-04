'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
      
    if (result.length === 0) {
      return {
        auth: user,
        profile: null,
      };
    }
    
    return {
      auth: user,
      profile: result[0],
    };
  } catch (dbError) {
    return {
      auth: user,
      profile: null,
    };
  }
});
