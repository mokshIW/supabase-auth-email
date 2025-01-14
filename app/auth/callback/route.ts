import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Adding an instance of the social auth provider login to the profiles table
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user data: ", userError.message);
        return NextResponse.redirect(`${origin}/error`);
      }

      // Now check if user exists in the user_profiles table
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", data?.user?.email)
        .single();

      if (!existingUser) {
        // Insert the new user into the user_profiles table
        const { data: userData } = await supabase.from("user_profiles").insert({
          email: data?.user?.email,
          username:
            data?.user?.user_metadata?.user_name ||
            data?.user?.user_metadata?.name,
        });

        // console.log("userData", userData);

        // if (dbError) {
        //   console.error(
        //     "Error inserting user into user_profiles table: ",
        //     dbError.message
        //   );
        //   return NextResponse.redirect(`${origin}/error`);
        // }

        // return { status: "success", user: data.user };
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
